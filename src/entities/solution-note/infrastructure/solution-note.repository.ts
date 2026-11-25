import type {
  CreateSolutionNotePayload,
  ReviseSolutionNotePayload,
} from '@/entities/solution-note/types';
import { api } from '@/shared/api';
import { unwrapEnvelope } from '@/shared/lib/api-utils';

import { dto, payload } from './solution-note.dto';

const BASE = '/student/solution-notes';

/** POST /api/student/solution-notes (api-contract §1.1). 채점은 기존 challenge-attempts 가 먼저. */
const create = async (
  input: CreateSolutionNotePayload,
  idempotencyKey: string
) => {
  const body = payload.createRequest.parse(input);
  const response = await api.private.post(BASE, body, {
    headers: { 'Idempotency-Key': idempotencyKey },
  });
  return unwrapEnvelope(response, dto.createResponse);
};

/** GET /api/student/solution-notes/{id} (§1.3) */
const getDetail = async (id: number) => {
  const response = await api.private.get(`${BASE}/${id}`);
  return unwrapEnvelope(response, dto.detail);
};

/** GET /api/student/solution-notes/{id}/explanation (§1.2). 제출 뒤 무료. */
const getExplanation = async (id: number) => {
  const response = await api.private.get(`${BASE}/${id}/explanation`);
  return unwrapEnvelope(response, dto.explanation);
};

/** GET /api/student/solution-notes/{id}/versions/{n} (§1.4) 획 URL 포함 */
const getVersion = async (id: number, versionNo: number) => {
  const response = await api.private.get(`${BASE}/${id}/versions/${versionNo}`);
  return unwrapEnvelope(response, dto.version);
};

/** POST /api/student/solution-notes/{id}/revisions (§1.6) */
const revise = async (id: number, input: ReviseSolutionNotePayload) => {
  const body = payload.reviseRequest.parse(input);
  const response = await api.private.post(`${BASE}/${id}/revisions`, body);
  return unwrapEnvelope(response, dto.reviseResponse);
};

/** PUT /api/student/solution-notes/{id}/stuck-reasons (§1.7). 전체 교체. */
const saveStuckReasons = async (id: number, reasons: string[]) => {
  const response = await api.private.put(`${BASE}/${id}/stuck-reasons`, {
    reasons,
  });
  return unwrapEnvelope(response, dto.stuckReasonResponse);
};

/** GET /api/student/solution-notes?challengeId= (§1.5). 같은 문제의 예전 풀이, 최신순. */
const getHistory = async (challengeId: number) => {
  const response = await api.private.get(BASE, { params: { challengeId } });
  return unwrapEnvelope(response, dto.history);
};

/** GET /api/student/solution-notes?nodeId= (N10). 그 단원 하위 문제의 내 풀이노트, 최신순. */
const getHistoryByNode = async (nodeId: number) => {
  const response = await api.private.get(BASE, { params: { nodeId } });
  return unwrapEnvelope(response, dto.history);
};

export const solutionNoteRepository = {
  getHistory,
  getHistoryByNode,
  create,
  getDetail,
  getExplanation,
  getVersion,
  revise,
  saveStuckReasons,
};
