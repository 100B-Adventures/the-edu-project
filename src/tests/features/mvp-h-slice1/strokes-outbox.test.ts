import {
  createMemoryStore,
  enqueueStrokes,
  flushStrokesOutbox,
  setOutboxStore,
  settleDeferredStrokes,
} from '@/entities/handwriting/infrastructure/strokes-outbox';
import type { Stroke } from '@/shared/components/drawing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  uploadStrokesObject: vi.fn(),
  attachStrokes: vi.fn(),
}));

vi.mock('@/entities/handwriting/infrastructure/handwriting.repository', () => ({
  handwritingRepository: {
    uploadStrokesObject: mocks.uploadStrokesObject,
    attachStrokes: mocks.attachStrokes,
  },
}));

const STROKES = [{ id: 'a' }] as unknown as Stroke[];
const UPLOADED = {
  strokesMediaId: 5,
  strokeCount: 1,
  strokeBytes: 10,
  strokesSha256: 'x'.repeat(64),
};

describe('시험 항목 S34 획 업로드 실패 뒤 보관과 재첨부 (교차 리뷰 P1-9)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setOutboxStore(createMemoryStore());
  });

  it('S34-1 PNG 만 저장돼 대기 중이면 획을 보관하고, 올려 붙인 뒤에 지운다', async () => {
    mocks.uploadStrokesObject.mockResolvedValue(UPLOADED);
    mocks.attachStrokes.mockResolvedValue({ strokesPending: false });
    const queued = await settleDeferredStrokes(
      { strokesDeferred: true },
      { assetId: 9, strokesPending: true },
      STROKES
    );
    expect(queued).toBe(true);
    await vi.waitFor(() =>
      expect(mocks.attachStrokes).toHaveBeenCalledWith(9, UPLOADED)
    );
    // 붙은 뒤에는 보관함이 비어 있어 다시 돌려도 아무것도 올리지 않는다.
    await flushStrokesOutbox();
    expect(mocks.uploadStrokesObject).toHaveBeenCalledTimes(1);
  });

  it('S34-2 거절: 획이 이미 올라갔거나 서버가 대기로 받지 않았으면 보관하지 않는다', async () => {
    expect(
      await settleDeferredStrokes(
        { strokesDeferred: false },
        { assetId: 9, strokesPending: true },
        STROKES
      )
    ).toBe(false);
    expect(
      await settleDeferredStrokes(
        { strokesDeferred: true },
        { assetId: 9, strokesPending: false },
        STROKES
      )
    ).toBe(false);
    expect(
      await settleDeferredStrokes({ strokesDeferred: true }, null, STROKES)
    ).toBe(false);
    expect(mocks.uploadStrokesObject).not.toHaveBeenCalled();
  });

  it('S34-3 올리기에 실패하면 지우지 않고 남겨 다음 기회에 다시 한다', async () => {
    await enqueueStrokes(7, STROKES);
    mocks.uploadStrokesObject.mockRejectedValueOnce(new Error('net'));
    expect(await flushStrokesOutbox()).toBe(0);
    mocks.uploadStrokesObject.mockResolvedValueOnce(UPLOADED);
    mocks.attachStrokes.mockResolvedValueOnce({ strokesPending: false });
    expect(await flushStrokesOutbox()).toBe(1);
    expect(mocks.attachStrokes).toHaveBeenCalledWith(7, UPLOADED);
  });

  it('S34-4 서버가 이미 붙었다(409)고 하면 더 시도하지 않고 지운다', async () => {
    await enqueueStrokes(8, STROKES);
    mocks.uploadStrokesObject.mockResolvedValue(UPLOADED);
    mocks.attachStrokes.mockRejectedValueOnce({ response: { status: 409 } });
    await flushStrokesOutbox();
    mocks.attachStrokes.mockClear();
    await flushStrokesOutbox();
    expect(mocks.attachStrokes).not.toHaveBeenCalled();
  });

  it('S34-5 동시에 두 번 불러도 한 번만 돈다', async () => {
    await enqueueStrokes(6, STROKES);
    mocks.uploadStrokesObject.mockResolvedValue(UPLOADED);
    mocks.attachStrokes.mockResolvedValue({ strokesPending: false });
    await Promise.all([flushStrokesOutbox(), flushStrokesOutbox()]);
    expect(mocks.attachStrokes).toHaveBeenCalledTimes(1);
  });
});
