import {
  type Stroke,
  exportStrokesToDataURL,
} from '@/shared/components/drawing';

const RESULT_STORAGE_KEY_PREFIX = 'open-challenge-result';

/**
 * 결과 화면이 읽을 제출 결과를 sessionStorage 에 둔다. 내가 쓴 손글씨 풀이는 정오·공유 여부와 무관하게 결과 상단에 보인다.
 * 그림 dataURL 때문에 용량이 넘치면 그림 없이 결과만 저장한다.
 */
export const persistSolveResult = (
  challengeId: string,
  strokes: Stroke[],
  result: Record<string, unknown>
) => {
  let myDrawingDataUrl: string | undefined;
  if (strokes.length > 0) {
    try {
      myDrawingDataUrl = exportStrokesToDataURL(strokes);
    } catch {
      // 렌더 실패가 결과 화면 이동을 막지 않도록 한다.
    }
  }
  const storageKey = `${RESULT_STORAGE_KEY_PREFIX}:${challengeId}`;
  try {
    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify({ ...result, myDrawingDataUrl })
    );
  } catch {
    window.sessionStorage.setItem(storageKey, JSON.stringify(result));
  }
};
