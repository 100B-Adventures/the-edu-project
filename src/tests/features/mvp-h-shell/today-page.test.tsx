import { StrictMode } from 'react';

import { TodayPage } from '@/features/today/components/today-page';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OVERVIEW, renderWithQuery } from '../mvp-h-slice1/helpers';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  updateTodo: vi.fn(),
}));

vi.mock('@/shared/api', () => ({
  api: { private: { get: mocks.get } },
}));
vi.mock('@/features/app-shell/hooks/use-shell-queries', () => ({
  useReceivedMessagesQuery: () => ({ data: [] }),
}));
vi.mock('@/features/dashboard/hooks', () => ({
  useStudentTodosQuery: () => ({
    data: { items: [], totalCount: 0, doneCount: 0 },
    isError: false,
    isPending: false,
    refetch: vi.fn(),
  }),
  useUpdateTodo: () => ({ mutate: mocks.updateTodo }),
}));
vi.mock('@/features/dashboard/hooks/use-wrong-answer-query', () => ({
  useDailyProblemsQuery: () => ({ data: { items: [] } }),
}));
vi.mock('@/features/dashboard/components/student/weekly-retro-card', () => ({
  WeeklyRetroCard: () => <div data-testid="weekly-retro" />,
}));
vi.mock('@/shared/lib/mvp-h-slice', () => ({
  isMvpHSliceEnabled: () => true,
}));

describe('MVP-H 학습 홈 N회독 개요 조회', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.get.mockResolvedValue(OVERVIEW);
  });

  it('T-DPQ-FE-1 StrictMode 재실행에도 overview 네트워크 호출은 한 번만 한다', async () => {
    renderWithQuery(
      <StrictMode>
        <TodayPage />
      </StrictMode>
    );

    expect(
      await screen.findByText('오늘 다시 볼 문제 3개')
    ).toBeInTheDocument();
    await waitFor(() => {
      const overviewCalls = mocks.get.mock.calls.filter(
        ([url]) => url === '/student/review/overview'
      );
      expect(overviewCalls).toHaveLength(1);
    });
  });
});
