import { SolutionNoteView } from '@/features/solution-note/components/solution-note-view';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithQuery } from './helpers';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  put: vi.fn(),
  post: vi.fn(),
  push: vi.fn(),
}));

vi.mock('@/shared/api', () => ({
  api: { private: { get: mocks.get, put: mocks.put, post: mocks.post } },
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, back: vi.fn() }),
}));
vi.mock('@/features/open-challenge/hooks/use-open-challenge', () => ({
  useOpenChallengeDetailQuery: () => ({ data: undefined }),
}));

vi.mock('@/shared/components/drawing', () => ({
  SolutionDrawingPad: () => <div data-testid="pad" />,
}));
vi.mock('@/shared/components/drawing/model/drawing-storage', () => ({
  savePageStrokes: vi.fn(),
}));

const DETAIL = {
  solutionNoteId: 3,
  challengeId: 11,
  challengeAttemptId: 21,
  isCorrect: false,
  elapsedSeconds: 120,
  labels: ['SUBMITTED_BEFORE_EXPLANATION'],
  stuckReasons: [],
  explanation: { mode: 'FREE_AFTER_SUBMIT' },
  currentVersionNo: 1,
  versions: [
    {
      versionNo: 1,
      kind: 'SUBMITTED',
      createdAt: '2026-11-23T09:00:00',
      strokeCount: 4,
      pngUrl: null,
      strokesPending: false,
      diffMarks: [{ y0: 0.1, y1: 0.2 }],
    },
  ],
  wrongAnswer: { id: 501, reviewCount: 0, status: 'ACTIVE' },
};

const EXPLANATION = {
  solutionNoteId: 3,
  steps: [{ no: 1, text: '공차를 구한다', tag: '개념' }],
  cost: { points: 0 },
};

describe('시험 항목 S21 제출 뒤 두 칸 풀이노트', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.get.mockImplementation((url: string) => {
      if (url === '/student/solution-notes/3') return Promise.resolve(DETAIL);
      if (url === '/student/solution-notes/3/explanation')
        return Promise.resolve(EXPLANATION);
      return Promise.reject(new Error(`unmocked ${url}`));
    });
  });

  it('S21-1 내 풀이와 해설 두 칸을 같은 화면에 보이고 다른 곳 개수를 적는다', async () => {
    renderWithQuery(<SolutionNoteView solutionNoteId={3} />);
    expect(
      await screen.findByRole('region', { name: '내 풀이' })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('region', { name: '해설' })
    ).toBeInTheDocument();
    expect(await screen.findByText(/공차를 구한다/)).toBeInTheDocument();
    expect(screen.getByTestId('diff-count')).toHaveTextContent('다른 곳 1');
  });

  it('S21-2 막힌 이유 칩을 누르면 stuck-reasons 전체 교체 PUT 을 부른다', async () => {
    const user = userEvent.setup();
    mocks.put.mockResolvedValue({
      reasons: ['TOOK_LONG'],
      suggestImport: false,
    });
    renderWithQuery(<SolutionNoteView solutionNoteId={3} />);
    const chips = await screen.findAllByTestId('stuck-chip');
    await user.click(chips[0]!);
    await waitFor(() => expect(mocks.put).toHaveBeenCalled());
    expect(mocks.put.mock.calls[0]![0]).toBe(
      '/student/solution-notes/3/stuck-reasons'
    );
    expect(mocks.put.mock.calls[0]![1]).toEqual({ reasons: ['TOOK_LONG'] });
  });

  it('S21-3 틀린 문제에서 백지에 다시 풀기를 누르면 백지 화면으로 이동한다', async () => {
    const user = userEvent.setup();
    renderWithQuery(<SolutionNoteView solutionNoteId={3} />);
    await user.click(await screen.findByTestId('note-to-blank'));
    expect(mocks.push).toHaveBeenCalledWith(
      '/dashboard/student/review/blank/501'
    );
  });

  it('S21-4 고치기를 누르면 그림판이 열리고 저장 버튼으로 바뀐다', async () => {
    const user = userEvent.setup();
    mocks.get.mockImplementation((url: string) => {
      if (url === '/student/solution-notes/3') return Promise.resolve(DETAIL);
      if (url === '/student/solution-notes/3/explanation')
        return Promise.resolve(EXPLANATION);
      if (url.endsWith('/versions/1'))
        return Promise.resolve({
          versionNo: 1,
          kind: 'SUBMITTED',
          pngUrl: null,
          strokesUrl: null,
          diffMarks: [],
        });
      return Promise.reject(new Error(`unmocked ${url}`));
    });
    renderWithQuery(<SolutionNoteView solutionNoteId={3} />);
    await user.click(await screen.findByTestId('note-start-fix'));
    expect(await screen.findByTestId('note-save-fix')).toBeInTheDocument();
    expect(screen.getByTestId('pad')).toBeInTheDocument();
  });

  it('S21-5 풀이노트를 못 찾으면 오류 상태를 보이고 다시 시도 버튼이 있다', async () => {
    mocks.get.mockRejectedValue(new Error('404'));
    renderWithQuery(<SolutionNoteView solutionNoteId={3} />);
    expect(
      await screen.findByText('풀이노트를 찾을 수 없어요')
    ).toBeInTheDocument();
  });
});
