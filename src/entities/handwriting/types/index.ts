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
  /**
   * 동의가 없어 획 좌표는 올리지 않는다(PNG 만 저장, FDD §5.1). 획 객체를 만들지도 올리지도 않고
   * strokesDeferred 도 false 다. 나중에 다시 붙일 대상이 아니기 때문이다.
   */
  pngOnly?: boolean;
};

export type StrokesPayload = {
  schemaVersion: number;
  layoutWidth: number;
  layoutHeight: number;
  strokes: Stroke[];
};
