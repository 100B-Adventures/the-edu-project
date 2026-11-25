import { BlankRetry } from '@/features/review/components/blank-retry';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithQuery } from './helpers';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  upload: vi.fn(),
  getConsent: vi.fn(),
  grant: vi.fn(),
  items: [] as Array<Record<string, unknown>>,
}));

vi.mock('@/shared/api', () => ({
  api: { private: { get: mocks.get, post: mocks.post } },
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));
vi.mock('@/entities/handwriting', () => ({
  handwritingRepository: {
    uploadHandwriting: mocks.upload,
    getConsent: mocks.getConsent,
    grantConsent: mocks.grant,
  },
  settleDeferredStrokes: vi.fn(),
  flushStrokesOutbox: vi.fn(),
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
    mocks.getConsent.mockResolvedValue({ granted: true });
    mocks.grant.mockResolvedValue(undefined);
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
    await waitFor(() =>
      expect(screen.getByTestId('blank-reward')).toBeInTheDocument()
    );
    const finishes = mocks.post.mock.calls.filter((c) =>
      String(c[0]).endsWith('/blank-retries')
    );
    expect(finishes).toHaveLength(1);
  });

  const PNG_ONLY_REF = {
    pngMediaId: 1,
    strokesMediaId: null,
    strokesDeferred: false,
    strokeCount: 0,
    strokeBytes: 0,
    strokesSha256: null,
    pngSha256: 'b'.repeat(64),
    schemaVersion: 1,
    layoutWidth: 1024,
    layoutHeight: 1400,
  };
  const finishes = () =>
    mocks.post.mock.calls.filter((c) =>
      String(c[0]).endsWith('/blank-retries')
    );

  it('S23-8 거절: 동의가 없고 나중에 를 누르면 획 좌표 없이 PNG 한 장으로 다 풀었어요를 보낸다 (2회차 P1-5)', async () => {
    const user = userEvent.setup();
    mocks.getConsent.mockResolvedValue({ granted: false });
    mocks.upload.mockResolvedValue(PNG_ONLY_REF);
    renderWithQuery(<BlankRetry wrongAnswerId={501} />);
    await user.click((await screen.findAllByTestId('blank-choice'))[1]!);
    await user.click(screen.getByTestId('blank-submit'));
    await user.click(await screen.findByTestId('consent-decline'));
    await waitFor(() =>
      expect(screen.getByTestId('blank-reward')).toBeInTheDocument()
    );
    expect(mocks.upload).toHaveBeenCalledWith(
      expect.objectContaining({ pngOnly: true })
    );
    expect(finishes()).toHaveLength(1);
    const body = finishes()[0]![1] as {
      handwriting: { strokesMediaId: number | null };
    };
    expect(body.handwriting.strokesMediaId).toBeNull();
  });

  it('S23-8b 서버가 동의문 버전 변경(CONSENT_REQUIRED)을 주고 다시 거절하면 획 없는 PNG 로 다시 올려 보낸다', async () => {
    const user = userEvent.setup();
    mocks.upload
      .mockResolvedValueOnce({
        ...PNG_ONLY_REF,
        strokesMediaId: 2,
        strokeCount: 3,
        strokeBytes: 100,
        strokesSha256: 'a'.repeat(64),
      })
      .mockResolvedValueOnce(PNG_ONLY_REF);
    let finishCalls = 0;
    mocks.post.mockImplementation((url: string) => {
      if (url.endsWith('/blank-sessions')) {
        return Promise.resolve({ blankSessionId: 88, dueNow: true });
      }
      finishCalls += 1;
      if (finishCalls === 1) {
        return Promise.reject(
          new AxiosError('x', '400', undefined, undefined, {
            status: 400,
            data: {
              code: 'CONSENT_REQUIRED',
              message: '동의 필요',
              data: { consentType: 'HANDWRITING_STORE' },
            },
            statusText: '',
            headers: {},
            config: {} as never,
          })
        );
      }
      return Promise.resolve(RESULT);
    });
    renderWithQuery(<BlankRetry wrongAnswerId={501} />);
    await user.click((await screen.findAllByTestId('blank-choice'))[1]!);
    await user.click(screen.getByTestId('blank-submit'));
    mocks.getConsent.mockResolvedValue({ granted: false });
    await user.click(await screen.findByTestId('consent-decline'));
    await waitFor(() => expect(finishes()).toHaveLength(2));
    expect(mocks.upload).toHaveBeenCalledTimes(2);
    expect(mocks.upload).toHaveBeenLastCalledWith(
      expect.objectContaining({ pngOnly: true })
    );
    const second = finishes()[1]![1] as {
      handwriting: { strokesMediaId: number | null };
    };
    expect(second.handwriting.strokesMediaId).toBeNull();
  });

  it('S23-9 동의가 없으면 창에서 동의를 기록한 뒤에 업로드하고 마무리를 보낸다', async () => {
    const user = userEvent.setup();
    mocks.getConsent.mockResolvedValue({ granted: false });
    renderWithQuery(<BlankRetry wrongAnswerId={501} />);
    await user.click((await screen.findAllByTestId('blank-choice'))[1]!);
    await user.click(screen.getByTestId('blank-submit'));
    expect(mocks.upload).not.toHaveBeenCalled();
    await user.click(await screen.findByTestId('consent-agree'));
    await waitFor(() =>
      expect(screen.getByTestId('blank-reward')).toBeInTheDocument()
    );
    expect(mocks.grant).toHaveBeenCalledWith('HANDWRITING_STORE');
    expect(mocks.upload).toHaveBeenCalledTimes(1);
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

  it('S23-10 마무리가 BLANK_SESSION_EXPIRED 로 거절돼도 필기는 그대로 두고 새로 시작할 수 있다 (교차 리뷰 P1-13)', async () => {
    const user = userEvent.setup();
    let sessions = 0;
    mocks.post.mockImplementation((url: string) => {
      if (url.endsWith('/blank-sessions')) {
        sessions += 1;
        return Promise.resolve({ blankSessionId: 87 + sessions, dueNow: true });
      }
      return Promise.reject(
        new AxiosError('x', '409', undefined, undefined, {
          status: 409,
          data: { code: 'BLANK_SESSION_EXPIRED', message: '만료' },
          statusText: '',
          headers: {},
          config: {} as never,
        })
      );
    });
    renderWithQuery(<BlankRetry wrongAnswerId={501} />);
    await user.click((await screen.findAllByTestId('blank-choice'))[1]!);
    await user.click(screen.getByTestId('blank-submit'));
    expect(await screen.findByTestId('blank-expired')).toHaveTextContent(
      '쓴 필기는 그대로 남아 있어요'
    );
    // 필기 보기: 안내만 접히고 화면(필기 칸·답)은 그대로다.
    await user.click(screen.getByTestId('blank-expired-view'));
    expect(screen.queryByTestId('blank-expired')).toBeNull();
    expect(screen.getByTestId('blank-submit')).toBeInTheDocument();
    await user.click(screen.getByTestId('blank-submit'));
    await user.click(await screen.findByTestId('blank-expired-restart'));
    await waitFor(() => expect(sessions).toBe(2));
    await waitFor(() =>
      expect(screen.queryByTestId('blank-expired')).toBeNull()
    );
    // 새 세션 번호(89 가 아닌 88)로 다시 보낸다.
    await user.click(screen.getByTestId('blank-submit'));
    const finishes = mocks.post.mock.calls.filter((c) =>
      String(c[0]).endsWith('/blank-retries')
    );
    expect(finishes.at(-1)![1]).toMatchObject({ blankSessionId: 89 });
  });

  it('S23-11 마무리 요청은 세션 번호를 키로 한 Idempotency-Key 를 보낸다 (교차 리뷰 P1-6)', async () => {
    const user = userEvent.setup();
    renderWithQuery(<BlankRetry wrongAnswerId={501} />);
    await user.click((await screen.findAllByTestId('blank-choice'))[1]!);
    await user.click(screen.getByTestId('blank-submit'));
    await waitFor(() =>
      expect(screen.getByTestId('blank-reward')).toBeInTheDocument()
    );
    const call = mocks.post.mock.calls.find((c) =>
      String(c[0]).endsWith('/blank-retries')
    );
    expect(call?.[2]).toEqual({ headers: { 'Idempotency-Key': 'blank-88' } });
  });
});
