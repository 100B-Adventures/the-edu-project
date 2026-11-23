import { handwritingRepository } from '@/entities/handwriting';
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

export class ConsentDeclinedError extends Error {
  constructor() {
    super('HANDWRITING_CONSENT_DECLINED');
  }
}

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

/**
 * 제출 직후 풀이노트를 만든다(api-contract §1.1). 채점은 기존 challenge-attempts 가 먼저 끝나 있다.
 * 순서(D-128): 동의 확인 -> 손필기 업로드 -> 노트 생성. 동의가 없는데 올리지 않는다.
 * - 동의를 못 받으면(나중에, 기록 실패) ConsentDeclinedError 로 멈춘다. 업로드는 일어나지 않았다.
 * - 서버가 그래도 400 CONSENT_REQUIRED 를 주면(동의 버전이 바뀐 경우) 다시 묻고, 올려 둔 손필기를 재사용해 한 번 더 보낸다.
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
): Promise<number> => {
  if (!(await ensureConsent())) throw new ConsentDeclinedError();
  const handwriting = await handwritingRepository.uploadHandwriting({
    strokes,
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
  try {
    try {
      return (await send()).solutionNoteId;
    } catch (error) {
      if (!getConsentRequired(error)) throw error;
      if (!(await ensureConsent(true))) throw new ConsentDeclinedError();
      return (await send()).solutionNoteId;
    }
  } catch (error) {
    const body = errorBody(error);
    if (
      body?.code === 'SOLUTION_NOTE_ALREADY_EXISTS' &&
      body.data?.solutionNoteId
    ) {
      return body.data.solutionNoteId;
    }
    throw error;
  }
};
