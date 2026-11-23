import { BlankRetry } from '@/features/review/components/blank-retry';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithQuery } from './helpers';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  upload: vi.fn(),
  items: [] as Array<Record<string, unknown>>,
}));

vi.mock('@/shared/api', () => ({
  api: { private: { get: mocks.get, post: mocks.post } },
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));
vi.mock('@/entities/handwriting', () => ({
  handwritingRepository: { uploadHandwriting: mocks.upload },
}));
vi.mock('@/shared/components/drawing', () => ({
  SolutionDrawingPad: () => <div data-testid="pad" />,
}));
vi.mock('@/features/dashboard/hooks/use-wrong-answer-query', () => ({
  useWrongAnswersQuery: () => ({
    isPending: false,
    data: { items: mocks.items },
  }),
}));
vi.mock('@/features/open-challenge/hooks/use-open-challenge', () => ({
  useOpenChallengeDetailQuery: () => ({
    data: {
      questionText: '합은?',
      questionImageUrl: null,
      answerType: 'MULTIPLE_CHOICE',
      choices: ['1', '2'],
    },
  }),
}));

const RESULT = {
  reviewNo: 3,
  reviewCount: 3,
  graduated: false,
  schedulerVersion: 1,
  countedAsReview: true,
  nextReviewAt: '2026-11-30T09:00:00',
  reward: { granted: true, exp: 30 },
};

describe('시험 항목 S23 백지에 다시 풀기', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.items = [
      { id: 501, challengeId: 11, title: '합', questionText: '합은?' },
    ];
    mocks.upload.mockResolvedValue({
      pngMediaId: 1,
      strokesMediaId: 2,
      strokesDeferred: false,
      strokeCount: 3,
      strokeBytes: 100,
      strokesSha256: 'a'.repeat(64),
      pngSha256: 'b'.repeat(64),
      schemaVersion: 1,
      layoutWidth: 1024,
      layoutHeight: 1400,
    });
    mocks.post.mockImplementation((url: string) => {
      if (url.endsWith('/blank-sessions')) {
        return Promise.resolve({ blankSessionId: 88, dueNow: true });
      }
      return Promise.resolve(RESULT);
    });
  });

  it('S23-1 화면에 들어오면 blank-sessions 를 한 번 열고 답을 고르기 전엔 제출을 막는다', async () => {
    renderWithQuery(<BlankRetry wrongAnswerId={501} />);
    expect(await screen.findByTestId('blank-submit')).toBeDisabled();
    expect(mocks.post.mock.calls[0]![0]).toBe(
      '/student/wrong-answers/501/blank-sessions'
    );
    expect(mocks.post).toHaveBeenCalledTimes(1);
  });

  it('S23-2 답을 고르고 제출하면 selectedAnswer 만 보내고(selfJudgement 는 null) 얻은 EXP 를 보인다', async () => {
    const user = userEvent.setup();
    renderWithQuery(<BlankRetry wrongAnswerId={501} />);
    await user.click((await screen.findAllByTestId('blank-choice'))[1]!);
    await user.click(screen.getByTestId('blank-submit'));
    await waitFor(() =>
      expect(screen.getByTestId('blank-reward')).toHaveTextContent('+30 EXP')
    );
    const call = mocks.post.mock.calls.find((c) =>
      String(c[0]).endsWith('/blank-retries')
    );
    expect(call?.[1]).toMatchObject({
      blankSessionId: 88,
      selectedAnswer: '2',
      selfJudgement: null,
    });
  });

  it('S23-7 거절: 손글씨 업로드가 끝나기 전에 제출을 연달아 눌러도 마무리는 한 번만 보낸다', async () => {
    const user = userEvent.setup();
    let release: (value: unknown) => void = () => {};
    mocks.upload.mockImplementation(
      () => new Promise((resolve) => (release = resolve))
    );
    renderWithQuery(<BlankRetry wrongAnswerId={501} />);
    await user.click((await screen.findAllByTestId('blank-choice'))[1]!);
    await user.dblClick(screen.getByTestId('blank-submit'));
    expect(mocks.upload).toHaveBeenCalledTimes(1);
    release({
      pngMediaId: 1,
      strokesMediaId: 2,
      strokesDeferred: false,
      strokeCount: 3,
      strokeBytes: 100,
      strokesSha256: 'a'.repeat(64),
      pngSha256: 'b'.repeat(64),
      schemaVersion: 1,
      layoutWidth: 1024,
      layoutHeight: 1400,
    });
    await waitFor(() => expect(screen.getByTestId('blank-reward')).toBeInTheDocument());
    const finishes = mocks.post.mock.calls.filter((c) =>
      String(c[0]).endsWith('/blank-retries')
    );
    expect(finishes).toHaveLength(1);
  });

  it('S23-3 답칸이 없는 문제는 맞았어요/틀렸어요를 골라야 제출되고 selectedAnswer 는 null 이다', async () => {
    const user = userEvent.setup();
    mocks.items = [{ id: 501, challengeId: null, title: '교재 12번' }];
    renderWithQuery(<BlankRetry wrongAnswerId={501} />);
    expect(await screen.findByTestId('blank-submit')).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '맞았어요' }));
    await user.click(screen.getByTestId('blank-submit'));
    await waitFor(() =>
      expect(screen.getByTestId('blank-result')).toBeInTheDocument()
    );
    const call = mocks.post.mock.calls.find((c) =>
      String(c[0]).endsWith('/blank-retries')
    );
    expect(call?.[1]).toMatchObject({
      selfJudgement: 'CORRECT',
      selectedAnswer: null,
    });
  });
});
