import { useRouter } from 'next/navigation';

import { submitSolutionNote } from '@/features/solution-note/submit-solution-note';
import { useHandwritingConsent } from '@/features/solution-note/use-handwriting-consent';
import type { Stroke } from '@/shared/components/drawing';
import { showBottomToast } from '@/shared/components/ui';
import { PRIVATE } from '@/shared/constants';
import { isMvpHSliceEnabled } from '@/shared/lib/mvp-h-slice';

import type { DrawingShareFailure } from './use-drawing-share';

type HandoffInput = {
  challengeId: string;
  attemptId: string;
  strokes: Stroke[];
  elapsedSeconds: number;
  shareDrawing: (
    challengeId: string,
    attemptId: string,
    strokes: Stroke[]
  ) => Promise<DrawingShareFailure | undefined>;
};

export type HandoffOutcome =
  /** 풀이노트로 이동했다. 호출한 쪽은 더 할 일이 없다. */
  | { kind: 'navigated' }
  /** 이동하지 않았다. 기존 결과 화면 흐름을 이어 가고 그 흐름이 공유를 맡는다. */
  | { kind: 'fallback' };

/**
 * MVP-H 조각 1: 제출 뒤에는 풀이노트(내 풀이 | 해설 두 칸)로 간다(교차 리뷰 P1-14: 제출 화면에서 분리).
 * - 노트가 만들어지면 D-14 손글씨 공유를 먼저 하고(교차 리뷰 P1-12) 풀이노트로 이동한다. 공유가 실패해도 이동은 막지 않고 알린다.
 *   동의가 없어 PNG 만 저장했다면 손글씨를 남에게 보이지 않는다(공유하지 않는다).
 * - 노트를 못 만들면 기존 결과 화면 흐름으로 이어 가 제출 자체는 막지 않는다. 그 흐름이 공유를 맡는다.
 */
export const useSolutionNoteHandoff = () => {
  const router = useRouter();
  const { ensureConsent, consentDialog } = useHandwritingConsent();

  const handoff = async ({
    challengeId,
    attemptId,
    strokes,
    elapsedSeconds,
    shareDrawing,
  }: HandoffInput): Promise<HandoffOutcome> => {
    if (!isMvpHSliceEnabled()) return { kind: 'fallback' };
    try {
      const { solutionNoteId, strokesSaved } = await submitSolutionNote(
        {
          attemptId: Number(attemptId),
          strokes,
          elapsedSeconds,
          idempotencyKey: `sn-${challengeId}-${attemptId}`,
        },
        ensureConsent
      );
      if (strokesSaved && strokes.length > 0) {
        const failure = await shareDrawing(challengeId, attemptId, strokes);
        if (failure) {
          showBottomToast(
            '풀이노트는 만들었지만 손글씨 공유는 올리지 못했어요.'
          );
        }
      } else if (!strokesSaved) {
        showBottomToast(
          '손글씨는 저장하지 않고 풀이 사진만 풀이노트에 남겼어요.'
        );
      }
      router.push(PRIVATE.DASHBOARD.SOLUTION_NOTE(solutionNoteId));
      return { kind: 'navigated' };
    } catch {
      showBottomToast('풀이노트를 만들지 못했어요. 결과 화면으로 이동해요.');
      return { kind: 'fallback' };
    }
  };

  return { handoff, consentDialog };
};
