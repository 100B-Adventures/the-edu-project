import { LessonPage } from '@/features/teaching-lesson/components/lesson-page';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithQuery } from './helpers';

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
  useGetTeacherNoteDetail: () => ({
    isPending: false,
    data: {
      id: 7,
      resolvedContent: {
        content: JSON.stringify({
          type: 'doc',
          content: [
            { type: 'image', attrs: { src: 'https://img.example/a.png' } },
          ],
        }),
      },
      studentInfos: [{ studentId: 9, studentName: '민서', readAt: null }],
    },
  }),
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
      if (url.endsWith('/teaching-notes/7/problems')) {
        return Promise.resolve({
          teachingNoteId: 7,
          problems: [
            {
              problemId: 1,
              position: 1,
              challengeId: 4006,
              title: '7. 미분',
              solvedTogether: true,
              memo: null,
            },
          ],
        });
      }
      return Promise.reject(new Error(`unmocked ${url}`));
    });
  });

  it('S22-1 학생은 수업 정보와 수업노트에 붙은 문제를 같이 푼 문제로 본다', async () => {
    renderWithQuery(<LessonPage studyRoomId={4} />);
    expect(await screen.findByText(/11\/25 19:00/)).toBeInTheDocument();
    expect(await screen.findAllByTestId('lesson-problem')).toHaveLength(1);
    expect(screen.getByText('7. 미분')).toBeInTheDocument();
    expect(screen.getByText('오답 먼저')).toBeInTheDocument();
  });

  it('S22-2 같이 푼 문제를 누르면 그 문제 풀이 화면으로 이동한다', async () => {
    const user = userEvent.setup();
    renderWithQuery(<LessonPage studyRoomId={4} />);
    await user.click((await screen.findAllByTestId('lesson-problem'))[0]!);
    expect(mocks.push).toHaveBeenCalledWith('/open-challenge/4006');
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
    // 선생님 읽기 API 로 저장해 둔 값이 입력칸에 미리 채워진다.
    await waitFor(() =>
      expect(screen.getByLabelText('정기 수업')).toHaveValue('화 목')
    );
    expect(screen.getByLabelText('선생님 한마디')).toHaveValue('오답 먼저');
    await user.click(screen.getByTestId('lesson-info-save'));
    await waitFor(() => expect(mocks.put).toHaveBeenCalled());
    expect(mocks.put.mock.calls[0]![0]).toBe(
      '/teacher/study-rooms/4/lesson-info'
    );
    expect(mocks.put.mock.calls[0]![1]).toMatchObject({
      weeklyRule: '화 목',
      teacherNote: '오답 먼저',
    });
    // 선생님은 teacher 읽기 API 를 쓴다. 학생용 lesson-info GET 을 부르면 403 이다(스모크에서 발견).
    expect(
      mocks.get.mock.calls.some(
        (call) => call[0] === '/teacher/study-rooms/4/lesson-info'
      )
    ).toBe(true);
    expect(
      mocks.get.mock.calls.some((call) => String(call[0]).includes('/student/'))
    ).toBe(false);
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

  it('S22-6 이번 주 질문 보내기는 weekly-question 으로 제목과 내용을 POST 한다', async () => {
    const user = userEvent.setup();
    mocks.post.mockResolvedValue({ contextId: 5, weekStart: '2026-11-23' });
    renderWithQuery(<LessonPage studyRoomId={4} />);
    await user.type(await screen.findByLabelText('질문 제목'), '합 공식');
    await user.type(screen.getByLabelText('질문 내용'), '왜 그런가요');
    await user.click(screen.getByTestId('lesson-weekly-send'));
    await waitFor(() => expect(mocks.post).toHaveBeenCalled());
    expect(mocks.post.mock.calls[0]![0]).toBe('/student/study-rooms/4/weekly-question');
    expect(mocks.post.mock.calls[0]![1]).toMatchObject({ title: '합 공식', content: '왜 그런가요' });
  });

  it('S22-7 거절: 제목이 비면 보내기 버튼이 눌리지 않는다', async () => {
    renderWithQuery(<LessonPage studyRoomId={4} />);
    await screen.findByLabelText('질문 제목');
    expect(screen.getByTestId('lesson-weekly-send')).toBeDisabled();
  });

  it('S22-6 선생님 화면은 학생 탭, 판서 사진, 같이 푼 문제 카드, 힌트, 업로드 링크를 보인다', async () => {
    mocks.role.role = 'ROLE_TEACHER';
    renderWithQuery(<LessonPage studyRoomId={4} />);
    const tabs = await screen.findByTestId('lesson-student-tabs');
    expect(tabs).toHaveTextContent('민서');
    expect(tabs.querySelector('a')).toHaveAttribute(
      'href',
      '/dashboard/teacher/students/9'
    );
    expect(await screen.findByAltText('판서 사진')).toBeInTheDocument();
    expect(await screen.findByTestId('lesson-problem-card')).toHaveTextContent(
      '다시 풀기'
    );
    expect(await screen.findByTestId('lesson-hint')).toHaveTextContent(
      '오답 먼저'
    );
    expect(screen.getByTestId('lesson-add-photo')).toHaveAttribute(
      'href',
      '/study-rooms/4/note/7/edit'
    );
    expect(screen.getByTestId('lesson-upload-photo')).toHaveAttribute(
      'href',
      '/study-rooms/4/note/new'
    );
  });
});
