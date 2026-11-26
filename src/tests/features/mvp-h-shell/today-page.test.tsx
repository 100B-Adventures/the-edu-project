import { StrictMode } from 'react';

import { TodayPage } from '@/features/today/components/today-page';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
vi.mock('@/features/schedule/components/week-schedule', () => ({
  WeekSchedule: () => <div>이번 주 시간표 화면</div>,
}));
vi.mock('@/features/schedule/components/year-schedule', () => ({
  YearSchedule: () => <div>연간 일정 화면</div>,
}));
vi.mock('@/shared/lib/mvp-h-slice', () => ({
  isMvpHSliceEnabled: () => true,
}));

describe('MVP-H 학습 홈 N회독 개요 조회', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.get.mockImplementation((url: string) =>
      url === '/student/schedule'
        ? Promise.resolve({
            blocks: [],
            defaultScope: { kind: 'TODAY', until: '2026-11-26' },
          })
        : Promise.resolve(OVERVIEW)
    );
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

  it('T-SHL-C3 오늘 주소 안에서 이번 주와 연간 탭이 실제 화면을 바꾼다', async () => {
    const user = userEvent.setup();
    renderWithQuery(<TodayPage />);

    const week = screen.getByRole('tab', { name: '이번 주' });
    expect(week).toBeVisible();
    expect(week).toHaveClass('min-h-touch-min');
    await user.click(week);
    expect(screen.getByText('이번 주 시간표 화면')).toBeVisible();
    await user.click(screen.getByRole('tab', { name: '연간' }));
    expect(screen.getByText('연간 일정 화면')).toBeVisible();
  });

  it('T-SCH-5 서버 기본 범위가 WEEK면 이번 주 탭을 첫 화면으로 연다', async () => {
    mocks.get.mockImplementation((url: string) =>
      url === '/student/schedule'
        ? Promise.resolve({
            blocks: [],
            defaultScope: { kind: 'WEEK', until: '2026-11-29' },
          })
        : Promise.resolve(OVERVIEW)
    );

    renderWithQuery(<TodayPage />);

    expect(await screen.findByText('이번 주 시간표 화면')).toBeVisible();
    expect(screen.getByRole('tab', { name: '이번 주' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });
});
