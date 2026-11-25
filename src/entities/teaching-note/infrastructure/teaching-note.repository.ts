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

/** GET /api/teacher/study-rooms/{id}/lesson-info (백엔드 4차). 선생님이 저장해 둔 값을 불러온다. */
const getTeacherLessonInfo = async (
  studyRoomId: number,
  studentId?: number
) => {
  // studentId 를 주면 그 학생의 메모까지 받는다(D-129, 교차 리뷰 P1-11). 응답의 myMemo 가 그 학생의 메모다.
  const response = await api.private.get(
    `/teacher/study-rooms/${studyRoomId}/lesson-info`,
    studentId === undefined ? undefined : { params: { studentId } }
  );
  return unwrapEnvelope(response, dto.lessonInfo);
};

/** GET /api/{teacher|student}/teaching-notes/{id}/problems (백엔드 4차). 수업노트에 붙은 같이 푼 문제. */
const getNoteProblems = async (
  role: 'student' | 'teacher',
  teachingNoteId: number
) => {
  const response = await api.private.get(
    `/${role}/teaching-notes/${teachingNoteId}/problems`
  );
  return unwrapEnvelope(response, dto.noteProblems);
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
const saveLessonInfo = async (
  studyRoomId: number,
  input: LessonInfoPayload
) => {
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
const createShareLink = async (
  teachingNoteId: number,
  expiresInDays?: number
) => {
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

/** GET /api/common/teaching-note-shares/{token}. 그 방의 선생님·승인된 학생이면 방·노트 id, 아니면 404. */
const resolveShare = async (token: string) => {
  const response = await api.private.get(
    `/common/teaching-note-shares/${token}`
  );
  return unwrapEnvelope(response, dto.shareResolve);
};

/** POST /api/student/study-rooms/{id}/weekly-question (§1.17). 무료 방은 한 주에 한 번. */
const askWeeklyQuestion = async (
  studyRoomId: number,
  input: { title: string; content: string }
) => {
  const response = await api.private.post(
    `/student/study-rooms/${studyRoomId}/weekly-question`,
    { title: input.title, content: input.content, mediaIds: [] }
  );
  return unwrapEnvelope(response, dto.weeklyQuestion);
};

export const teachingNoteRepository = {
  askWeeklyQuestion,
  getLessonInfo,
  getTeacherLessonInfo,
  getNoteProblems,
  saveMemo,
  saveLessonInfo,
  attachProblem,
  createShareLink,
  revokeShareLink,
  getStudentReviewSummary,
  getShareMeta,
  resolveShare,
};
