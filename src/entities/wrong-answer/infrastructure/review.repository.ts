import type {
  BlankRetryPayload,
  ReviewCardsQuery,
  ReviewImportPayload,
  ReviewView,
} from '@/entities/wrong-answer/types/review';
import { api } from '@/shared/api';
import { unwrapEnvelope } from '@/shared/lib/api-utils';

import { reviewDto, reviewPayload } from './review.dto';

const STUDENT = '/student';

/** GET /api/student/review/overview (api-contract §1.10). 개수·요약만. */
const getOverview = async (view: ReviewView = 'curve') => {
  const response = await api.private.get(`${STUDENT}/review/overview`, {
    params: { view },
  });
  return unwrapEnvelope(response, reviewDto.overview);
};

/** GET /api/student/review/cards (§1.11) */
const getCards = async (query: ReviewCardsQuery, page = 0, size = 20) => {
  const response = await api.private.get(`${STUDENT}/review/cards`, {
    params: { ...query, page, size },
  });
  return unwrapEnvelope(response, reviewDto.cards);
};

/** 키가 있으면 Idempotency-Key 헤더로 보낸다. 같은 키의 재요청은 서버가 첫 응답을 돌려준다(교차 리뷰 P1-6). */
const idempotencyHeaders = (key?: string) =>
  key ? { headers: { 'Idempotency-Key': key } } : undefined;

/** POST /api/student/wrong-answers/imports (§1.12) */
const importProblems = async (
  input: ReviewImportPayload,
  idempotencyKey?: string
) => {
  const body = reviewPayload.importRequest.parse(input);
  const response = await api.private.post(
    `${STUDENT}/wrong-answers/imports`,
    body,
    idempotencyHeaders(idempotencyKey)
  );
  return unwrapEnvelope(response, reviewDto.importResponse);
};

/** GET /api/student/review/random-problem (§1.13). 없으면 404 NO_REVIEWABLE_PROBLEM. */
const getRandomProblem = async () => {
  const response = await api.private.get(`${STUDENT}/review/random-problem`);
  return unwrapEnvelope(response, reviewDto.randomProblem);
};

/** POST /api/student/wrong-answers/{id}/blank-sessions (§1.8). 이미 열린 세션이면 그것을 돌려준다. */
const startBlankSession = async (wrongAnswerId: number) => {
  const response = await api.private.post(
    `${STUDENT}/wrong-answers/${wrongAnswerId}/blank-sessions`
  );
  return unwrapEnvelope(response, reviewDto.blankSession);
};

/** POST /api/student/wrong-answers/{id}/blank-retries (§1.9) */
const finishBlankRetry = async (
  wrongAnswerId: number,
  input: BlankRetryPayload,
  idempotencyKey?: string
) => {
  const body = reviewPayload.blankRetryRequest.parse(input);
  const response = await api.private.post(
    `${STUDENT}/wrong-answers/${wrongAnswerId}/blank-retries`,
    body,
    idempotencyHeaders(idempotencyKey)
  );
  return unwrapEnvelope(response, reviewDto.blankRetryResponse);
};

/** POST /api/student/wrong-answers/{id}/archive (§1.16) */
const archive = async (wrongAnswerId: number) => {
  const response = await api.private.post(
    `${STUDENT}/wrong-answers/${wrongAnswerId}/archive`
  );
  return unwrapEnvelope(response, reviewDto.archive);
};

export const reviewRepository = {
  getOverview,
  getCards,
  importProblems,
  getRandomProblem,
  startBlankSession,
  finishBlankRetry,
  archive,
};
