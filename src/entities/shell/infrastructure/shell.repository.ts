import type {
  AppPolicy,
  GrowthPeriods,
  MessagePayload,
  Notice,
  NoticePayload,
  OfficeSummary,
  ResumeResponse,
  ShellMessage,
  ShellTrack,
  StudentOverview,
} from '@/entities/shell/types';
import { api } from '@/shared/api';
import { unwrapEnvelope } from '@/shared/lib/api-utils';

import { dto, payload } from './shell.dto';

const idempotencyKey = (scope: string) =>
  `${scope}-${globalThis.crypto.randomUUID()}`;

/* 학생 */
const getTrack = async (): Promise<ShellTrack> =>
  unwrapEnvelope(await api.private.get('/student/me/track'), dto.track);

const getResume = async (): Promise<ResumeResponse> =>
  unwrapEnvelope(await api.private.get('/student/home/resume'), dto.resume);

const getPeriods = async (weeks?: number): Promise<GrowthPeriods> =>
  unwrapEnvelope(
    await api.private.get('/student/growth/periods', {
      params: weeks ? { weeks } : undefined,
    }),
    dto.periods
  );

const getReceivedMessages = async (): Promise<ShellMessage[]> =>
  unwrapEnvelope(await api.private.get('/student/messages'), dto.messageList)
    .items;

/* 공통 */
const getOfficeSummary = async (roomId: number): Promise<OfficeSummary> =>
  unwrapEnvelope(
    await api.private.get(`/common/study-rooms/${roomId}/office-summary`),
    dto.officeSummary
  );

const getPolicy = async (): Promise<AppPolicy> =>
  unwrapEnvelope(await api.private.get('/common/app-policy'), dto.appPolicy);

/* 공지: 학생은 읽기만, 선생님은 쓰기 */
const getNotices = async (
  role: 'student' | 'teacher',
  roomId: number
): Promise<Notice[]> =>
  unwrapEnvelope(
    await api.private.get(`/${role}/study-rooms/${roomId}/notices`),
    dto.noticeList
  ).items;

const createNotice = async (
  roomId: number,
  input: NoticePayload
): Promise<Notice> =>
  unwrapEnvelope(
    await api.private.post(
      `/teacher/study-rooms/${roomId}/notices`,
      payload.notice.parse(input),
      { headers: { 'Idempotency-Key': idempotencyKey('notice') } }
    ),
    dto.notice
  );

const updateNotice = async (
  roomId: number,
  noticeId: number,
  input: NoticePayload
): Promise<Notice> =>
  unwrapEnvelope(
    await api.private.patch(
      `/teacher/study-rooms/${roomId}/notices/${noticeId}`,
      payload.notice.parse(input)
    ),
    dto.notice
  );

const removeNotice = async (
  roomId: number,
  noticeId: number
): Promise<void> => {
  await api.private.delete(
    `/teacher/study-rooms/${roomId}/notices/${noticeId}`
  );
};

/* 선생님 */
const getStudentOverview = async (
  studentId: number,
  roomId?: number
): Promise<StudentOverview> =>
  unwrapEnvelope(
    await api.private.get(`/teacher/students/${studentId}/overview`, {
      params: roomId ? { roomId } : undefined,
    }),
    dto.studentOverview
  );

const getSentMessages = async (
  studentId: number,
  roomId?: number
): Promise<ShellMessage[]> =>
  unwrapEnvelope(
    await api.private.get(`/teacher/students/${studentId}/messages`, {
      params: roomId ? { roomId } : undefined,
    }),
    dto.messageList
  ).items;

const sendMessage = async (
  studentId: number,
  input: MessagePayload
): Promise<{ id: number }> =>
  unwrapEnvelope(
    await api.private.post(
      `/teacher/students/${studentId}/messages`,
      payload.message.parse(input),
      { headers: { 'Idempotency-Key': idempotencyKey('message') } }
    ),
    dto.messageCreated
  );

export const repository = {
  getTrack,
  getResume,
  getPeriods,
  getReceivedMessages,
  getOfficeSummary,
  getPolicy,
  getNotices,
  createNotice,
  updateNotice,
  removeNotice,
  getStudentOverview,
  getSentMessages,
  sendMessage,
};
