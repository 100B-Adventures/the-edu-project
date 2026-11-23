import type {
  AttachProblemPayload,
  LessonInfoPayload,
} from '@/entities/teaching-note/types';
import { api } from '@/shared/api';
import { unwrapEnvelope } from '@/shared/lib/api-utils';

import { dto, payload } from './teaching-note.dto';

/** GET /api/student/study-rooms/{id}/lesson-info (api-contract §1.15) */
const getLessonInfo = async (studyRoomId: number) => {
  const response = await api.private.get(
    `/student/study-rooms/${studyRoomId}/lesson-info`
  );
  return unwrapEnvelope(response, dto.lessonInfo);
};

/** PUT /api/student/study-rooms/{id}/lesson-info/memo (§1.15) */
const saveMemo = async (studyRoomId: number, body: string) => {
  const response = await api.private.put(
    `/student/study-rooms/${studyRoomId}/lesson-info/memo`,
    { body }
  );
  return unwrapEnvelope(response, dto.memoSaved);
};

/** PUT /api/teacher/study-rooms/{id}/lesson-info (§1.15) */
const saveLessonInfo = async (studyRoomId: number, input: LessonInfoPayload) => {
  const body = payload.lessonInfoRequest.parse(input);
  const response = await api.private.put(
    `/teacher/study-rooms/${studyRoomId}/lesson-info`,
    body
  );
  return unwrapEnvelope(response, dto.memoSaved);
};

/** POST /api/teacher/teaching-notes/{id}/problems (§1.14). solvedTogether 이면 학생 전원 N회독 자동 등록. */
const attachProblem = async (
  teachingNoteId: number,
  input: AttachProblemPayload
) => {
  const body = payload.attachProblemRequest.parse(input);
  const response = await api.private.post(
    `/teacher/teaching-notes/${teachingNoteId}/problems`,
    body
  );
  return unwrapEnvelope(response, dto.attachProblem);
};

/** POST /api/teacher/teaching-notes/{id}/share-links (§1.14) */
const createShareLink = async (teachingNoteId: number, expiresInDays?: number) => {
  const response = await api.private.post(
    `/teacher/teaching-notes/${teachingNoteId}/share-links`,
    expiresInDays ? { expiresInDays } : {}
  );
  return unwrapEnvelope(response, dto.shareLink);
};

/** DELETE /api/teacher/teaching-notes/{id}/share-links/{token} (§1.14) */
const revokeShareLink = async (teachingNoteId: number, token: string) => {
  await api.private.delete(
    `/teacher/teaching-notes/${teachingNoteId}/share-links/${token}`
  );
};

/** GET /api/teacher/students/{id}/review-summary (§1.17) */
const getStudentReviewSummary = async (studentId: number) => {
  const response = await api.private.get(
    `/teacher/students/${studentId}/review-summary`
  );
  return unwrapEnvelope(response, dto.studentReviewSummary);
};

/** GET /api/public/teaching-note-shares/{token} (§1.14). 비로그인 메타만. */
const getShareMeta = async (token: string) => {
  const response = await api.public.get(
    `/public/teaching-note-shares/${token}`
  );
  return unwrapEnvelope(response, dto.shareMeta);
};

export const teachingNoteRepository = {
  getLessonInfo,
  saveMemo,
  saveLessonInfo,
  attachProblem,
  createShareLink,
  revokeShareLink,
  getStudentReviewSummary,
  getShareMeta,
};
