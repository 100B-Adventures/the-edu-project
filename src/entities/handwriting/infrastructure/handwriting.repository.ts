import type {
  HandwritingRef,
  StrokesPayload,
  UploadHandwritingInput,
} from '@/entities/handwriting/types';
import { api } from '@/shared/api';
import { exportStrokesToBlob } from '@/shared/components/drawing';
import type { Stroke } from '@/shared/components/drawing';

/** 획 JSON 스키마 버전. 바꾸면 서버 저장분과 호환이 깨지므로 새 번호를 만든다. */
export const STROKES_SCHEMA_VERSION = 1;
const DEFAULT_LAYOUT_WIDTH = 1024;
const DEFAULT_LAYOUT_HEIGHT = 1400;

type PresignItem = {
  id: number;
  mediaId: string;
  uploadUrl: string;
  headers: Record<string, string>;
};

type PresignResponse = { data: { mediaAssetList: PresignItem[] } };

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

export const sha256Hex = async (data: Blob): Promise<string> => {
  // Uint8Array 로 감싸 넘긴다. 브라우저에서는 같은 결과지만, Blob 이 다른 실행 환경(jsdom 등)의
  // ArrayBuffer 를 돌려줘도 digest 가 받는다.
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new Uint8Array(await data.arrayBuffer())
  );
  return toHex(digest);
};

const gzipText = async (text: string): Promise<Blob> => {
  const stream = new Blob([text])
    .stream()
    .pipeThrough(new CompressionStream('gzip'));
  return new Response(stream).blob();
};

export const resolveLayout = (strokes: Stroke[]) => {
  const width = strokes.reduce(
    (max, stroke) => Math.max(max, stroke.layoutWidth ?? 0),
    0
  );
  const height = strokes.reduce(
    (max, stroke) => Math.max(max, stroke.layoutHeight ?? 0),
    0
  );
  return {
    layoutWidth: width > 0 ? Math.round(width) : DEFAULT_LAYOUT_WIDTH,
    layoutHeight: height > 0 ? Math.round(height) : DEFAULT_LAYOUT_HEIGHT,
  };
};

export const buildStrokesPayload = (strokes: Stroke[]): StrokesPayload => ({
  schemaVersion: STROKES_SCHEMA_VERSION,
  ...resolveLayout(strokes),
  strokes,
});

const putObject = async (item: PresignItem, body: Blob) => {
  const response = await fetch(item.uploadUrl, {
    method: 'PUT',
    headers: item.headers,
    body,
  });
  if (!response.ok) {
    throw new Error('손필기 업로드에 실패했어요.');
  }
};

/** 동의 없이 PNG 한 장만 올린다. 획 좌표는 만들지도 올리지도 않는다. */
const uploadPngOnly = async (strokes: Stroke[]): Promise<HandwritingRef> => {
  const png = await exportStrokesToBlob(strokes);
  const pngSha256 = await sha256Hex(png);
  const presign = await api.private.post<PresignResponse>(
    '/common/media/presign-batch',
    {
      mediaAssetList: [
        {
          fileName: 'handwriting.png',
          contentType: 'image/png',
          sizeBytes: png.size,
          targetType: 'HANDWRITING_PNG',
        },
      ],
    }
  );
  const pngItem = presign.data.mediaAssetList[0];
  if (!pngItem) throw new Error('손필기 업로드 주소를 받지 못했어요.');
  await putObject(pngItem, png);
  return {
    pngMediaId: pngItem.id,
    strokesMediaId: null,
    strokesDeferred: false,
    strokeCount: 0,
    strokeBytes: 0,
    strokesSha256: null,
    pngSha256,
    schemaVersion: STROKES_SCHEMA_VERSION,
    ...resolveLayout(strokes),
  };
};

/**
 * 획 -> PNG + 획 JSON(gz) 두 객체를 올리고 서버가 요구하는 HandwritingRef 를 만든다.
 * 획 객체만 실패하면 PNG 만 올리고 strokesDeferred 로 표시한다(계약 §0.4).
 * 빈 획이어도 PNG(흰 바탕)는 올린다. 서버가 strokeCount=0 으로 빈 제출을 판정한다.
 */
const uploadHandwriting = async ({
  strokes,
  pngOnly = false,
}: UploadHandwritingInput): Promise<HandwritingRef> => {
  if (pngOnly) return uploadPngOnly(strokes);
  const png = await exportStrokesToBlob(strokes);
  const payload = buildStrokesPayload(strokes);
  const strokesBlob = await gzipText(JSON.stringify(payload));
  const [pngSha256, strokesSha256] = await Promise.all([
    sha256Hex(png),
    sha256Hex(strokesBlob),
  ]);

  const presign = await api.private.post<PresignResponse>(
    '/common/media/presign-batch',
    {
      mediaAssetList: [
        {
          fileName: 'handwriting.png',
          contentType: 'image/png',
          sizeBytes: png.size,
          targetType: 'HANDWRITING_PNG',
        },
        {
          fileName: 'handwriting-strokes.json.gz',
          contentType: 'application/gzip',
          sizeBytes: strokesBlob.size,
          targetType: 'HANDWRITING_STROKES',
        },
      ],
    }
  );
  const [pngItem, strokesItem] = presign.data.mediaAssetList;
  if (!pngItem || !strokesItem) {
    throw new Error('손필기 업로드 주소를 받지 못했어요.');
  }

  await putObject(pngItem, png);

  let strokesUploaded = true;
  try {
    await putObject(strokesItem, strokesBlob);
  } catch {
    strokesUploaded = false;
  }

  return {
    pngMediaId: pngItem.id,
    strokesMediaId: strokesUploaded ? strokesItem.id : null,
    strokesDeferred: !strokesUploaded,
    strokeCount: strokes.length,
    strokeBytes: strokesBlob.size,
    strokesSha256: strokesUploaded ? strokesSha256 : null,
    pngSha256,
    schemaVersion: payload.schemaVersion,
    layoutWidth: payload.layoutWidth,
    layoutHeight: payload.layoutHeight,
  };
};

export type AttachedStrokes = {
  strokesMediaId: number;
  strokeCount: number;
  strokeBytes: number;
  strokesSha256: string;
};

/** 획 객체(gz) 하나만 올린다. 먼저 실패한 업로드를 다시 시도할 때 쓴다. */
const uploadStrokesObject = async (
  strokes: Stroke[]
): Promise<AttachedStrokes> => {
  const strokesBlob = await gzipText(
    JSON.stringify(buildStrokesPayload(strokes))
  );
  const strokesSha256 = await sha256Hex(strokesBlob);
  const presign = await api.private.post<PresignResponse>(
    '/common/media/presign-batch',
    {
      mediaAssetList: [
        {
          fileName: 'handwriting-strokes.json.gz',
          contentType: 'application/gzip',
          sizeBytes: strokesBlob.size,
          targetType: 'HANDWRITING_STROKES',
        },
      ],
    }
  );
  const item = presign.data.mediaAssetList[0];
  if (!item) throw new Error('손필기 업로드 주소를 받지 못했어요.');
  await putObject(item, strokesBlob);
  return {
    strokesMediaId: item.id,
    strokeCount: strokes.length,
    strokeBytes: strokesBlob.size,
    strokesSha256,
  };
};

/** POST /api/student/handwriting/{assetId}/strokes. PNG 만 저장된 쪽에 획을 붙인다. */
const attachStrokes = async (assetId: number, attached: AttachedStrokes) => {
  const response = (await api.private.post(
    `/student/handwriting/${assetId}/strokes`,
    attached
  )) as { data?: { strokesPending?: boolean } };
  return { strokesPending: response?.data?.strokesPending === true };
};

/** 받아 온 획 객체(gz)를 풀어 Stroke[] 로. 판 이어 쓰기에 쓴다. */
const fetchStrokes = async (strokesUrl: string): Promise<Stroke[]> => {
  const response = await fetch(strokesUrl);
  if (!response.ok || !response.body) {
    throw new Error('예전 획을 불러오지 못했어요.');
  }
  const text = await new Response(
    response.body.pipeThrough(new DecompressionStream('gzip'))
  ).text();
  const parsed = JSON.parse(text) as Partial<StrokesPayload>;
  return Array.isArray(parsed.strokes) ? parsed.strokes : [];
};

/** 문제 가져오기(사진) 업로드. targetType=WRONG_ANSWER_IMPORT (§0.4 새 targetType). */
const uploadImportPhoto = async (
  file: File
): Promise<{ mediaAssetId: number; sha256: string }> => {
  const presign = await api.private.post<PresignResponse>(
    '/common/media/presign-batch',
    {
      mediaAssetList: [
        {
          fileName: file.name,
          contentType: file.type || 'image/jpeg',
          sizeBytes: file.size,
          targetType: 'WRONG_ANSWER_IMPORT',
        },
      ],
    }
  );
  const item = presign.data.mediaAssetList[0];
  if (!item) {
    throw new Error('사진 업로드 주소를 받지 못했어요.');
  }
  await putObject(item, file);
  return { mediaAssetId: item.id, sha256: await sha256Hex(file) };
};

/** POST /api/student/consents (백엔드 4차). 같은 상태를 다시 보내도 안전하다. */
const grantConsent = async (consentType: string) => {
  await api.private.post('/student/consents', {
    consentType,
    granted: true,
  });
};

/** GET /api/student/consents/{type}. 동의한 적이 없으면 granted=false. */
const getConsent = async (
  consentType: string
): Promise<{ granted: boolean }> => {
  const response = (await api.private.get(
    `/student/consents/${consentType}`
  )) as {
    data?: { granted?: boolean; version?: string; currentVersion?: string };
  };
  const data = response?.data;
  // 동의한 문구 버전이 지금 받는 버전과 다르면 동의하지 않은 것으로 본다(교차 리뷰 P1-3).
  // 서버가 버전을 안 주는 옛 응답이면 granted 만 본다.
  const versionMatches =
    !data?.currentVersion || data.version === data.currentVersion;
  return { granted: data?.granted === true && versionMatches };
};

export const handwritingRepository = {
  getConsent,
  grantConsent,
  uploadHandwriting,
  uploadStrokesObject,
  attachStrokes,
  fetchStrokes,
  uploadImportPhoto,
};
