import { ReviewHome } from '@/features/review/components/review-home';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CARD, OVERVIEW, renderWithQuery } from './helpers';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  push: vi.fn(),
}));

vi.mock('@/shared/api', () => ({
  api: { private: { get: mocks.get, post: mocks.post, put: vi.fn() } },
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, back: vi.fn() }),
}));
vi.mock('@/features/point/hooks/use-point', () => ({
  useMyPointWalletQuery: () => ({ data: { balance: 1200 } }),
}));

const routeGet = (
  url: string,
  config?: { params?: Record<string, unknown> }
) => {
  if (url === '/student/review/overview') return Promise.resolve(OVERVIEW);
  if (url === '/student/review/cards') {
    return Promise.resolve({
      items: [CARD],
      totalCount: 1,
      params: config?.params,
    });
  }
  if (url === '/student/review/random-problem') {
    return Promise.resolve({ wrongAnswerId: 777, challengeId: 12 });
  }
  return Promise.reject(new Error(`unmocked ${url}`));
};

describe('시험 항목 S17 N회독 홈', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.get.mockImplementation(routeGet);
  });

  it('S17-1 개요와 카드를 실제 URL 로 불러와 레벨·카드를 그린다', async () => {
    renderWithQuery(<ReviewHome />);
    expect(await screen.findByText(/Lv\.4 · 320 EXP/)).toBeInTheDocument();
    expect(
      (await screen.findAllByTestId('review-card')).length
    ).toBeGreaterThan(0);
    const urls = mocks.get.mock.calls.map((call) => call[0]);
    expect(urls).toContain('/student/review/overview');
    expect(urls).toContain('/student/review/cards');
  });

  it('S17-2 카드를 누르면 미리보기가 열리고 해설 없이 다시 풀기가 백지 화면으로 이동한다', async () => {
    const user = userEvent.setup();
    renderWithQuery(<ReviewHome />);
    const [card] = await screen.findAllByTestId('review-card');
    await user.click(card!);
    await user.click(await screen.findByTestId('review-preview-blank'));
    expect(mocks.push).toHaveBeenCalledWith(
      '/dashboard/student/review/blank/501'
    );
  });

  it('S17-3 무작위 한 문제는 random-problem 을 부른 뒤 그 문제로 이동한다', async () => {
    const user = userEvent.setup();
    renderWithQuery(<ReviewHome />);
    await screen.findByText(/Lv\.4/);
    await user.click(screen.getByTestId('review-random'));
    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith(
        '/dashboard/student/review/blank/777'
      )
    );
    expect(mocks.get.mock.calls.map((call) => call[0])).toContain(
      '/student/review/random-problem'
    );
  });

  it('S17-4 상황별 탭에서 버튼을 누르면 이유 필터로 카드를 다시 불러온다', async () => {
    const user = userEvent.setup();
    renderWithQuery(<ReviewHome />);
    await screen.findByText(/Lv\.4/);
    await user.click(screen.getByTestId('review-tab-situation'));
    const [first] = await screen.findAllByTestId('review-situation');
    await user.click(first!);
    await waitFor(() => {
      const withReason = mocks.get.mock.calls.find(
        (call) =>
          call[0] === '/student/review/cards' &&
          call[1]?.params?.reason === 'NOT_FINISHED'
      );
      expect(withReason).toBeTruthy();
    });
  });

  it('S17-6 퀘스트 카드는 서버가 준 사진·막힌 이유·보상 EXP 를 그대로 보인다', async () => {
    renderWithQuery(<ReviewHome />);
    const item = await screen.findByTestId('review-quest-item');
    expect(item).toHaveTextContent('등차수열의 합');
    expect(item).toHaveTextContent('오래 걸림');
    expect(item).toHaveTextContent('+20 EXP');
    expect(item.querySelector('img')).toHaveAttribute('src', 'https://img.example/q.png');
  });

  it('S17-5 개요 호출이 실패하면 오류 상태와 다시 시도 버튼을 보인다', async () => {
    mocks.get.mockRejectedValue(new Error('boom'));
    renderWithQuery(<ReviewHome />);
    expect(
      await screen.findByText('N회독을 불러오지 못했어요')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeEnabled();
  });

  it('S18-1 문제 가져오기 메뉴는 사진·교재·오늘 푼 문제 세 길을 연다', async () => {
    const user = userEvent.setup();
    renderWithQuery(<ReviewHome />);
    await screen.findByText(/Lv\.4/);
    await user.click(screen.getByTestId('review-import-open'));
    expect(
      await screen.findByRole('menuitem', { name: '사진으로' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: '교재에서' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: '오늘 푼 문제' })
    ).toBeInTheDocument();
  });

  it('S18-2 교재에서 입력을 채워 넣으면 TEXTBOOK 채널로 imports 를 부른다', async () => {
    const user = userEvent.setup();
    mocks.post.mockResolvedValue({
      created: [{ wrongAnswerId: 1, importChannel: 'TEXTBOOK' }],
      skippedDuplicates: [],
    });
    renderWithQuery(<ReviewHome />);
    await screen.findByText(/Lv\.4/);
    await user.click(screen.getByTestId('review-import-open'));
    await user.click(await screen.findByRole('menuitem', { name: '교재에서' }));
    await user.type(await screen.findByLabelText('교재 이름'), '쎈');
    await user.type(screen.getByLabelText('번호'), '12');
    await user.click(screen.getByTestId('review-import-textbook-submit'));
    await waitFor(() => expect(mocks.post).toHaveBeenCalled());
    const [url, body] = mocks.post.mock.calls[0]!;
    expect(url).toBe('/student/wrong-answers/imports');
    expect(body).toMatchObject({
      channel: 'TEXTBOOK',
      textbook: { title: '쎈', number: '12' },
    });
  });
});
