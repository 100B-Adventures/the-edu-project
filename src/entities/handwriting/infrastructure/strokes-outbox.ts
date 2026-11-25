import type { Stroke } from '@/shared/components/drawing';
import { type IDBPDatabase, openDB } from 'idb';

import { handwritingRepository } from './handwriting.repository';

/**
 * 획 재첨부 보관함(교차 리뷰 P1-9, FDD §5.3).
 * 획 업로드만 실패하면 PNG 만 올리고 strokesDeferred 로 노트를 만든다. 그때 획 원본을 서버가 확정해 줄 때까지
 * 브라우저에 보관하고, 응답에서 assetId 를 받으면 다시 올려 붙인다. 붙은 것이 확인되면 지운다.
 * 닫았다 열어도 남도록 IndexedDB 에 둔다. IndexedDB 를 못 쓰는 환경(시크릿 모드 등)에서는 탭이 열려 있는 동안만 메모리에 둔다.
 */
export type OutboxEntry = {
  assetId: number;
  strokes: Stroke[];
  createdAt: string;
  attempts: number;
};

export type OutboxStore = {
  put(entry: OutboxEntry): Promise<void>;
  getAll(): Promise<OutboxEntry[]>;
  remove(assetId: number): Promise<void>;
};

const DB_NAME = 'handwriting-outbox';
const STORE = 'strokes';

const createIdbStore = (): OutboxStore => {
  let dbPromise: Promise<IDBPDatabase> | null = null;
  const db = () => {
    dbPromise ??= openDB(DB_NAME, 1, {
      upgrade(database) {
        database.createObjectStore(STORE, { keyPath: 'assetId' });
      },
    });
    return dbPromise;
  };
  return {
    put: async (entry) => {
      await (await db()).put(STORE, entry);
    },
    getAll: async () => (await db()).getAll(STORE),
    remove: async (assetId) => {
      await (await db()).delete(STORE, assetId);
    },
  };
};

export const createMemoryStore = (): OutboxStore => {
  const map = new Map<number, OutboxEntry>();
  return {
    put: async (entry) => {
      map.set(entry.assetId, entry);
    },
    getAll: async () => Array.from(map.values()),
    remove: async (assetId) => {
      map.delete(assetId);
    },
  };
};

const defaultStore = (): OutboxStore =>
  typeof indexedDB === 'undefined' ? createMemoryStore() : createIdbStore();

let store: OutboxStore | null = null;
const getStore = () => (store ??= defaultStore());

/** 시험에서 저장소를 바꿔 끼운다. */
export const setOutboxStore = (next: OutboxStore | null) => {
  store = next;
};

/** 노트·풀이 저장 응답이 strokesPending 이면 그 자산의 획을 보관함에 넣는다. */
export const enqueueStrokes = async (assetId: number, strokes: Stroke[]) => {
  await getStore().put({
    assetId,
    strokes,
    createdAt: new Date().toISOString(),
    attempts: 0,
  });
};

let flushing: Promise<number> | null = null;

/**
 * 보관함의 획을 하나씩 올려 붙인다. 성공(서버가 strokesPending=false)이거나
 * 이미 붙어 있다고(409) 하면 지운다. 그 밖의 실패는 남겨 두고 다음 기회에 다시 한다.
 * 같은 순간에 두 번 돌지 않는다. 돌려주는 값은 이번에 붙인 개수다.
 */
export const flushStrokesOutbox = (): Promise<number> => {
  flushing ??= (async () => {
    let attached = 0;
    try {
      const entries = await getStore().getAll();
      for (const entry of entries) {
        try {
          const uploaded = await handwritingRepository.uploadStrokesObject(
            entry.strokes
          );
          const result = await handwritingRepository.attachStrokes(
            entry.assetId,
            uploaded
          );
          if (!result.strokesPending) {
            await getStore().remove(entry.assetId);
            attached += 1;
          }
        } catch (error) {
          const status = (error as { response?: { status?: number } })?.response
            ?.status;
          if (status === 409 || status === 404) {
            // 이미 붙었거나(409) 파기돼 없는(404) 자산은 다시 시도할 이유가 없다.
            await getStore().remove(entry.assetId);
          } else {
            await getStore().put({ ...entry, attempts: entry.attempts + 1 });
          }
        }
      }
    } catch {
      // 보관함을 못 읽어도 화면 흐름을 막지 않는다.
    }
    return attached;
  })().finally(() => {
    flushing = null;
  });
  return flushing;
};

/**
 * 저장 응답을 받은 뒤 부른다. 획 업로드만 실패해 strokesDeferred 로 보냈고 서버도 PENDING 으로 받았으면
 * 획을 보관함에 넣고 바로 한 번 올려 본다. 화면 흐름은 기다리지 않는다.
 */
export const settleDeferredStrokes = async (
  ref: { strokesDeferred: boolean },
  result:
    | { assetId: number | null; strokesPending: boolean }
    | null
    | undefined,
  strokes: Stroke[]
) => {
  if (!ref.strokesDeferred || !result?.strokesPending || result.assetId == null)
    return false;
  await enqueueStrokes(result.assetId, strokes);
  void flushStrokesOutbox();
  return true;
};
