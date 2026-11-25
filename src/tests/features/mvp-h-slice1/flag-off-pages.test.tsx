import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/lib/assert-dashboard-role', () => ({
  assertDashboardRole: vi.fn(async () => undefined),
}));

vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

// 이 시험은 플래그가 꺼진 경로에서 notFound 를 부르는지만 본다. 무거운 화면 모듈은 가볍게 대체해
// import 비용(느린 환경에서 시간 초과)을 없앤다(N-18).
const stub = (name: string) => () => ({ __stub: name });
vi.mock('@/features/review/components/review-home', () => ({
  ReviewHome: stub('ReviewHome'),
}));
vi.mock('@/features/solution-note/components/solution-note-view', () => ({
  SolutionNoteView: stub('SolutionNoteView'),
}));
vi.mock('@/features/review/components/blank-retry', () => ({
  BlankRetry: stub('BlankRetry'),
}));
vi.mock('@/features/teaching-lesson/components/lesson-page', () => ({
  LessonPage: stub('LessonPage'),
}));
vi.mock('@/features/teaching-lesson/components/student-review-summary', () => ({
  StudentReviewSummary: stub('StudentReviewSummary'),
}));
vi.mock('@/features/teaching-lesson/components/share-meta-view', () => ({
  ShareMetaView: stub('ShareMetaView'),
}));
vi.mock('@/features/teaching-lesson/server-share-meta', () => ({
  buildShareDescription: () => '',
  fetchShareMetaOnServer: async () => null,
}));

const params = <T,>(value: T) => ({ params: Promise.resolve(value) });

describe('시험 항목 S26 플래그 꺼짐에서는 새 URL 이 열리지 않는다', () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => vi.unstubAllEnvs());

  const cases: Array<[string, () => Promise<unknown>]> = [
    [
      'N회독 홈',
      async () =>
        (
          await import('@/app/(private)/dashboard/student/review/page')
        ).default(),
    ],
    [
      '풀이노트',
      async () =>
        (
          await import(
            '@/app/(private)/dashboard/student/solution-notes/[id]/page'
          )
        ).default(params({ id: '1' })),
    ],
    [
      '백지 다시 풀기',
      async () =>
        (
          await import(
            '@/app/(private)/dashboard/student/review/blank/[wrongAnswerId]/page'
          )
        ).default(params({ wrongAnswerId: '1' })),
    ],
    [
      '선생님 1:1 수업',
      async () =>
        (await import('@/app/(private)/study-rooms/[id]/lesson/page')).default(
          params({ id: '1' })
        ),
    ],
    [
      '선생님 학생 현황',
      async () =>
        (
          await import(
            '@/app/(private)/dashboard/teacher/students/[studentId]/page'
          )
        ).default({
          ...params({ studentId: '1' }),
          searchParams: Promise.resolve({}),
        }),
    ],
    [
      '공유 링크',
      async () =>
        (await import('@/app/(public)/s/[token]/page')).default(
          params({ token: 'abc' })
        ),
    ],
  ];

  it.each(cases)(
    'S26-1 거절: %s 는 플래그가 꺼져 있으면 notFound',
    async (_name, render) => {
      vi.stubEnv('NEXT_PUBLIC_MVPH_SLICE1', '');
      await expect(render()).rejects.toThrow(/NEXT_NOT_FOUND/);
    }
  );

  it.each(cases)(
    'S26-2 %s 는 플래그가 켜져 있으면 화면을 돌려준다',
    async (_name, render) => {
      vi.stubEnv('NEXT_PUBLIC_MVPH_SLICE1', 'on');
      await expect(render()).resolves.toBeTruthy();
    }
  );
});
