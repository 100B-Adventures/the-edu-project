import { LessonPage } from '@/features/teaching-lesson/components/lesson-page';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CARD, renderWithQuery } from './helpers';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  put: vi.fn(),
  post: vi.fn(),
  push: vi.fn(),
  role: { role: 'ROLE_STUDENT' as string, isLoading: false },
}));

vi.mock('@/shared/api', () => ({
  api: { private: { get: mocks.get, put: mocks.put, post: mocks.post } },
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, back: vi.fn() }),
}));
vi.mock('@/shared/hooks/use-role', () => ({ useRole: () => mocks.role }));
vi.mock('@/features/study-notes/hooks', () => ({
  useGetStudentNotesList: () => ({
    isPending: false,
    data: {
      content: [{ id: 7, title: '등차수열', taughtAt: '2026-11-20T10:00:00' }],
    },
  }),
  useGetTeacherNotesList: () => ({
    isPending: false,
    data: {
      content: [{ id: 7, title: '등차수열', taughtAt: '2026-11-20T10:00:00' }],
    },
  }),
}));

const LESSON = {
  nextLesson: { at: '2026-11-25T19:00:00', minutes: 60, mode: '대면' },
  weekly: '화 목',
  teacherNote: '오답 먼저',
  myMemo: '질문 적기',
};

describe('시험 항목 S22 1:1 수업 화면', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.role.role = 'ROLE_STUDENT';
    mocks.get.mockImplementation((url: string) => {
      if (url.endsWith('/lesson-info')) return Promise.resolve(LESSON);
      if (url === '/student/review/cards') {
        return Promise.resolve({
          items: [
            CARD,
            { ...CARD, wrongAnswerId: 502, origin: { kind: 'OPEN' } },
          ],
          totalCount: 2,
        });
      }
      return Promise.reject(new Error(`unmocked ${url}`));
    });
  });

  it('S22-1 학생은 수업 정보와 수업 출처 문제만 같이 푼 문제로 본다', async () => {
    renderWithQuery(<LessonPage studyRoomId={4} />);
    expect(await screen.findByText(/11\/25 19:00/)).toBeInTheDocument();
    expect(await screen.findAllByTestId('lesson-problem')).toHaveLength(1);
    expect(screen.getByText('오답 먼저')).toBeInTheDocument();
  });

  it('S22-2 같이 푼 문제를 누르면 그 문제의 백지 화면으로 이동한다', async () => {
    const user = userEvent.setup();
    renderWithQuery(<LessonPage studyRoomId={4} />);
    await user.click((await screen.findAllByTestId('lesson-problem'))[0]!);
    expect(mocks.push).toHaveBeenCalledWith(
      '/dashboard/student/review/blank/501'
    );
  });

  it('S22-3 내 메모 저장은 lesson-info/memo 로 PUT 한다', async () => {
    const user = userEvent.setup();
    mocks.put.mockResolvedValue({});
    renderWithQuery(<LessonPage studyRoomId={4} />);
    await screen.findByText(/11\/25/);
    await user.click(screen.getByTestId('lesson-memo-save'));
    await waitFor(() => expect(mocks.put).toHaveBeenCalled());
    expect(mocks.put.mock.calls[0]![0]).toBe(
      '/student/study-rooms/4/lesson-info/memo'
    );
  });

  it('S22-4 선생님은 수업 정보를 저장하면 teacher lesson-info 로 PUT 한다', async () => {
    const user = userEvent.setup();
    mocks.role.role = 'ROLE_TEACHER';
    mocks.put.mockResolvedValue({});
    renderWithQuery(<LessonPage studyRoomId={4} />);
    await screen.findByLabelText('정기 수업');
    await user.click(screen.getByTestId('lesson-info-save'));
    await waitFor(() => expect(mocks.put).toHaveBeenCalled());
    expect(mocks.put.mock.calls[0]![0]).toBe(
      '/teacher/study-rooms/4/lesson-info'
    );
    expect(mocks.put.mock.calls[0]![1]).toMatchObject({
      weeklyRule: '화 목',
      teacherNote: '오답 먼저',
    });
  });

  it('S22-5 선생님이 같이 푼 문제 번호를 넣으면 teaching-notes problems 로 POST 한다', async () => {
    const user = userEvent.setup();
    mocks.role.role = 'ROLE_TEACHER';
    mocks.post.mockResolvedValue({
      problemId: 1,
      position: 1,
      autoRegistered: { studentCount: 2, pending: false },
    });
    renderWithQuery(<LessonPage studyRoomId={4} />);
    await user.click(await screen.findByTestId('lesson-attach-pick'));
    await user.type(await screen.findByLabelText('문제 번호'), '11');
    await user.click(screen.getByTestId('lesson-attach-submit'));
    await waitFor(() => expect(mocks.post).toHaveBeenCalled());
    expect(mocks.post.mock.calls[0]![0]).toBe(
      '/teacher/teaching-notes/7/problems'
    );
    expect(mocks.post.mock.calls[0]![1]).toMatchObject({
      challengeId: 11,
      solvedTogether: true,
    });
  });
});
