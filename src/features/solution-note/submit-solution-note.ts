import {
  handwritingRepository,
  settleDeferredStrokes,
} from '@/entities/handwriting';
import { solutionNoteRepository } from '@/entities/solution-note';
import type { Stroke } from '@/shared/components/drawing';
import axios from 'axios';

type SubmitInput = {
  attemptId: number;
  strokes: Stroke[];
  elapsedSeconds: number;
  /** 단답형 주관식 채점 불가 문제일 때만 학생이 고른 값 */
  selfJudgement?: 'CORRECT' | 'WRONG' | null;
  idempotencyKey: string;
};

type ErrorBody = {
  code?: string;
  data?: { solutionNoteId?: number; consentType?: string };
};

/** 400 CONSENT_REQUIRED 이면 동의 종류를 돌려준다(백엔드 4차: data.consentType). 아니면 null. */
export const getConsentRequired = (
  error: unknown
): { consentType: string } | null => {
  const body = errorBody(error);
  if (body?.code !== 'CONSENT_REQUIRED') return null;
  return { consentType: body.data?.consentType ?? 'HANDWRITING_STORE' };
};

const errorBody = (error: unknown): ErrorBody | null =>
  axios.isAxiosError(error)
    ? ((error.response?.data as ErrorBody) ?? null)
    : null;

export type SubmitResult = {
  solutionNoteId: number;
  /** false 면 동의가 없어 PNG 만 저장했다. 획 좌표는 올리지도 보관하지도 않았다. */
  strokesSaved: boolean;
};

/**
 * 제출 직후 풀이노트를 만든다(api-contract §1.1). 채점은 기존 challenge-attempts 가 먼저 끝나 있다.
 * 순서(D-128): 동의 확인 -> 손필기 업로드 -> 노트 생성. 동의가 없는데 획 좌표를 올리지 않는다.
 * - 동의를 못 받으면(나중에, 기록 실패) 획 좌표만 빼고 PNG 한 장으로 노트를 만든다(FDD §5.1, 교차 리뷰 P1-8).
 *   풀이노트와 채점 결과는 동의와 무관하게 남는다. strokesSaved=false 로 알려 호출한 쪽이 공유 등을 건너뛰게 한다.
 * - 서버가 그래도 400 CONSENT_REQUIRED 를 주면(동의 버전이 바뀐 경우) 다시 묻는다. 거절하면 PNG 만으로 다시 보낸다.
 * - 획 업로드만 실패하면 PNG 만 올리고 strokesDeferred 로 보낸다. 응답이 strokesPending 이면 획을 보관함에 넣어 다시 붙인다(P1-9).
 * - 이미 같은 시도로 만든 노트가 있으면(409 SOLUTION_NOTE_ALREADY_EXISTS) 그 노트 id 를 돌려준다.
 * - 빈 제출은 화면에서 이미 확인을 받았으므로 confirmEmpty 를 켠다.
 */
export const submitSolutionNote = async (
  {
    attemptId,
    strokes,
    elapsedSeconds,
    selfJudgement = null,
    idempotencyKey,
  }: SubmitInput,
  ensureConsent: (force?: boolean) => Promise<boolean>
): Promise<SubmitResult> => {
  let strokesSaved = await ensureConsent();
  let handwriting = await handwritingRepository.uploadHandwriting({
    strokes,
    pngOnly: !strokesSaved,
  });
  const send = () =>
    solutionNoteRepository.create(
      {
        challengeAttemptId: attemptId,
        elapsedSeconds,
        handwriting,
        confirmEmpty: strokes.length === 0,
        selfJudgement,
      },
      idempotencyKey
    );
  const sendSettled = async (): Promise<SubmitResult> => {
    const created = await send();
    if (strokesSaved) {
      await settleDeferredStrokes(handwriting, created.handwriting, strokes);
    }
    return { solutionNoteId: created.solutionNoteId, strokesSaved };
  };
  try {
    try {
      return await sendSettled();
    } catch (error) {
      if (!getConsentRequired(error)) throw error;
      const before = strokesSaved;
      strokesSaved = await ensureConsent(true);
      // 모양이 바뀔 때만 다시 올린다. 같으면 올려 둔 손글씨를 재사용한다.
      if (before !== strokesSaved) {
        handwriting = await handwritingRepository.uploadHandwriting({
          strokes,
          pngOnly: !strokesSaved,
        });
      }
      return await sendSettled();
    }
  } catch (error) {
    const body = errorBody(error);
    if (
      body?.code === 'SOLUTION_NOTE_ALREADY_EXISTS' &&
      body.data?.solutionNoteId
    ) {
      return { solutionNoteId: body.data.solutionNoteId, strokesSaved };
    }
    throw error;
  }
};
