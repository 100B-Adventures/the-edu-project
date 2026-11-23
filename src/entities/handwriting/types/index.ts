import type { Stroke } from '@/shared/components/drawing';

/** 서버 계약(api-contract §0.4)의 손필기 업로드 공통 단위 */
export type HandwritingRef = {
  pngMediaId: number;
  strokesMediaId: number | null;
  strokesDeferred: boolean;
  strokeCount: number;
  strokeBytes: number;
  strokesSha256: string | null;
  pngSha256: string;
  schemaVersion: number;
  layoutWidth: number;
  layoutHeight: number;
};

export type HandwritingResult = {
  assetId: number | null;
  strokesPending: boolean;
};

export type UploadHandwritingInput = {
  strokes: Stroke[];
};

export type StrokesPayload = {
  schemaVersion: number;
  layoutWidth: number;
  layoutHeight: number;
  strokes: Stroke[];
};
