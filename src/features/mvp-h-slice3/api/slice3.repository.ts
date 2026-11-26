import { api } from '@/shared/api';
import { unwrapEnvelope } from '@/shared/lib/api-utils';
import { z } from 'zod';

import type {
  BestCandidate,
  Declaration,
  Ebook,
  EbookChapter,
  FeedItem,
  LevelResult,
  LevelSession,
  Program,
  ProgramDay,
} from '../model/types';

const unknownValue = z.unknown();
const list = z.array(z.unknown());

const publicGet = async <T>(path: string): Promise<T> => {
  const response = await api.public.get(path);
  return unwrapEnvelope(response, unknownValue) as T;
};

const privateGet = async <T>(path: string): Promise<T> => {
  const response = await api.private.get(path);
  return unwrapEnvelope(response, unknownValue) as T;
};

const privateList = async <T>(path: string): Promise<T[]> => {
  const response = await api.private.get(path);
  return unwrapEnvelope(response, list) as T[];
};

const levelGuestToken = () => {
  const key = 'odokgong.level.guest-token';
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const created = window.crypto.randomUUID();
  window.localStorage.setItem(key, created);
  return created;
};

export const slice3Repository = {
  startLevel: async (input: {
    privacyConsent: boolean;
    aiConsent: boolean;
    schoolLevel: string;
    currentGrade: string;
    goal: string;
    worry: string;
  }): Promise<LevelSession> => {
    const response = await api.public.post(
      '/public/level-tests',
      {
        ...input,
      },
      {
        headers: { 'X-Guest-Token': levelGuestToken() },
      }
    );
    return unwrapEnvelope(response, unknownValue) as LevelSession;
  },
  answerLevel: async (testId: number, problemSetId: number, answer: string) => {
    await api.public.post(
      `/public/level-tests/${testId}/answers`,
      {
        problemSetId,
        answer,
      },
      {
        headers: { 'X-Guest-Token': levelGuestToken() },
      }
    );
  },
  submitLevel: async (testId: number): Promise<LevelResult> => {
    const response = await api.public.post(
      `/public/level-tests/${testId}/submit`,
      undefined,
      { headers: { 'X-Guest-Token': levelGuestToken() } }
    );
    return unwrapEnvelope(response, unknownValue) as LevelResult;
  },
  createGuestDeclaration: async (testId: number, body: string) => {
    const response = await api.public.post(
      `/public/level-tests/${testId}/declaration`,
      { body },
      { headers: { 'X-Guest-Token': levelGuestToken() } }
    );
    return unwrapEnvelope(response, unknownValue) as { id: number };
  },
  levelResult: async (testId: number) => {
    const response = await api.public.get(
      `/public/level-tests/${testId}/result`,
      {
        headers: { 'X-Guest-Token': levelGuestToken() },
      }
    );
    return unwrapEnvelope(response, unknownValue) as LevelResult;
  },
  library: () => privateList<Ebook>('/student/library'),
  publicLibrary: async () => {
    const response = await api.public.get('/public/library');
    return unwrapEnvelope(response, list) as Ebook[];
  },
  chapter: (ebookId: number, chapterNo: number) =>
    privateGet<EbookChapter>(
      `/student/library/ebooks/${ebookId}/chapters/${chapterNo}`
    ),
  previewChapter: (ebookId: number, chapterNo: number) =>
    publicGet<EbookChapter>(
      `/public/library/ebooks/${ebookId}/chapters/${chapterNo}`
    ),
  program: () => privateGet<Program>('/student/program'),
  programDays: () => privateList<ProgramDay>('/student/program/days'),
  programDay: (dayNo: number) =>
    privateGet<ProgramDay>(`/student/program/days/${dayNo}`),
  useBufferCoupon: async (
    couponId: number,
    forDate: string
  ): Promise<ProgramDay> => {
    const response = await api.private.post(
      `/student/program/buffer-coupons/${couponId}/use`,
      { forDate }
    );
    return unwrapEnvelope(response, unknownValue) as ProgramDay;
  },
  submitProgramDay: async (
    dayNo: number,
    noteBody: string,
    referenceAnchors: string[]
  ): Promise<ProgramDay> => {
    const response = await api.private.post(
      `/student/program/days/${dayNo}/submission`,
      { noteBody, referenceAnchors }
    );
    return unwrapEnvelope(response, unknownValue) as ProgramDay;
  },
  feed: async (kind = 'NOTE'): Promise<FeedItem[]> => {
    const response = await api.public.get('/public/feed', { params: { kind } });
    return unwrapEnvelope(response, list) as FeedItem[];
  },
  feedItem: (id: number) => publicGet<FeedItem>(`/public/feed/${id}`),
  cheer: async (id: number) => {
    const response = await api.private.post(
      `/common/public-notes/${id}/cheers`
    );
    return unwrapEnvelope(response, unknownValue) as { created: boolean };
  },
  publishNote: async (title: string, body: string): Promise<FeedItem> => {
    const response = await api.private.post(
      '/common/public-notes',
      { title, body },
      { headers: { 'Idempotency-Key': window.crypto.randomUUID() } }
    );
    return unwrapEnvelope(response, unknownValue) as FeedItem;
  },
  reportContent: async (kind: FeedItem['kind'], id: number, reason: string) => {
    const response = await api.private.post(
      `/common/public-content/${kind}/${id}/reports`,
      { reason }
    );
    return unwrapEnvelope(response, unknownValue) as { created: boolean };
  },
  createDeclaration: async (
    kind: Declaration['kind'],
    body: string,
    aiConsent: boolean
  ): Promise<Declaration> => {
    const response = await api.private.post(
      '/student/declarations',
      { kind, body, aiConsent },
      { headers: { 'Idempotency-Key': window.crypto.randomUUID() } }
    );
    return unwrapEnvelope(response, unknownValue) as Declaration;
  },
  publishDeclaration: async (id: number): Promise<Declaration> => {
    const response = await api.private.patch(
      `/student/declarations/${id}/visibility`,
      { visibility: 'PUBLIC_ANON' }
    );
    return unwrapEnvelope(response, unknownValue) as Declaration;
  },
  bestCandidates: () => privateList<BestCandidate>('/teacher/best-candidates'),
  pickBest: async (id: number, reason: string, weekOf: string) => {
    await api.private.post(`/teacher/public-notes/${id}/best`, {
      reason,
      weekOf,
    });
  },
  deleteBest: async (id: number, weekOf: string) => {
    await api.private.delete(`/teacher/public-notes/${id}/best`, {
      params: { weekOf },
    });
  },
  confirmProgramEnrollment: async (enrollmentId: number) => {
    const response = await api.private.post(
      `/teacher/program-enrollments/${enrollmentId}/confirm`
    );
    return unwrapEnvelope(response, unknownValue) as {
      enrollmentId: number;
      roomJoined: boolean;
      roomConnectionRequired: boolean;
    };
  },
  confirmOrder: async (
    paymentKey: string,
    orderKey: string,
    amount: number
  ) => {
    const response = await api.private.post('/common/course-orders/confirm', {
      paymentKey,
      orderKey,
      amount,
    });
    return unwrapEnvelope(response, unknownValue) as {
      orderId: number;
      enrollmentId: number;
      status: 'PAID';
      refundGuaranteed: boolean;
    };
  },
};
