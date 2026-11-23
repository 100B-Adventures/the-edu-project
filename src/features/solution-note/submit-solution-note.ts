import axios from 'axios';

import { handwritingRepository } from '@/entities/handwriting';
import { solutionNoteRepository } from '@/entities/solution-note';
import type { Stroke } from '@/shared/components/drawing';

type SubmitInput = {
  attemptId: number;
  strokes: Stroke[];
  elapsedSeconds: number;
  /** 단답형 주관식 채점 불가 문제일 때만 학생이 고른 값 */
  selfJudgement?: 'CORRECT' | 'WRONG' | null;
  idempotencyKey: string;
};

type ErrorBody = { code?: string; data?: { solutionNoteId?: number } };

const errorBody = (error: unknown): ErrorBody | null =>
  axios.isAxiosError(error) ? ((error.response?.data as ErrorBody) ?? null) : null;

/**
 * 제출 직후 풀이노트를 만든다(api-contract §1.1). 채점은 기존 challenge-attempts 가 먼저 끝나 있다.
 * - 이미 같은 시도로 만든 노트가 있으면(409 SOLUTION_NOTE_ALREADY_EXISTS) 그 노트 id 를 돌려준다.
 * - 빈 제출은 화면에서 이미 확인을 받았으므로 confirmEmpty 를 켠다.
 */
export const submitSolutionNote = async ({
  attemptId,
  strokes,
  elapsedSeconds,
  selfJudgement = null,
  idempotencyKey,
}: SubmitInput): Promise<number> => {
  const handwriting = await handwritingRepository.uploadHandwriting({ strokes });
  try {
    const created = await solutionNoteRepository.create(
      {
        challengeAttemptId: attemptId,
        elapsedSeconds,
        handwriting,
        confirmEmpty: strokes.length === 0,
        selfJudgement,
      },
      idempotencyKey
    );
    return created.solutionNoteId;
  } catch (error) {
    const body = errorBody(error);
    if (body?.code === 'SOLUTION_NOTE_ALREADY_EXISTS' && body.data?.solutionNoteId) {
      return body.data.solutionNoteId;
    }
    throw error;
  }
};
