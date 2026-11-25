import type { Stroke } from '@/shared/components/drawing';
import { useDrawingUpload } from '@/shared/components/drawing';

import { useCreateChallengeReviewMutation } from '../../hooks/use-open-challenge';

export type DrawingShareFailure = { strokes: Stroke[]; mediaAssetId?: number };

/**
 * D-14: 손글씨 풀이를 문제를 푼 사람들에게 공유한다(그림 올리기 -> 풀이 후기 등록).
 * 풀이노트 이동 전에도, 기존 결과 화면 흐름에서도 같은 코드를 쓰도록 한 곳에 둔다.
 * 실패해도 던지지 않고 재시도에 필요한 정보를 돌려준다(성공이면 undefined).
 */
export const useDrawingShare = () => {
  const createReviewMutation = useCreateChallengeReviewMutation();
  const { uploadDrawingAsync, isUploading } = useDrawingUpload(
    'CHALLENGE_REVIEW_DRAWING'
  );

  const shareDrawing = async (
    challengeId: string,
    attemptId: string,
    strokes: Stroke[]
  ): Promise<DrawingShareFailure | undefined> => {
    let mediaAssetId: number | undefined;
    try {
      ({ mediaAssetId } = await uploadDrawingAsync(strokes));
      await createReviewMutation.mutateAsync({
        challengeId,
        attemptId,
        solutionType: 'DRAWING',
        content: '',
        drawingImageMediaId: mediaAssetId,
      });
      return undefined;
    } catch {
      return { strokes, mediaAssetId };
    }
  };

  return { shareDrawing, isUploading };
};
