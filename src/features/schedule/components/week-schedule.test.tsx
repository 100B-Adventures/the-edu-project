import { WeekSchedule } from '@/features/schedule/components/week-schedule';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/schedule/hooks/use-schedule', () => ({
  useScheduleQuery: () => ({
    data: { blocks: [], defaultScope: { kind: 'WEEK', until: '2026-11-29' } },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useScheduleMutations: () => ({
    create: { mutate: vi.fn(), isPending: false },
    remove: { mutate: vi.fn() },
  }),
}));

describe('WeekSchedule 1024 7열 계약', () => {
  it('T-MVPH-WEEK-1 토요일·일요일까지 고정폭 없이 한 화면 7열로 줄어든다', () => {
    render(<WeekSchedule />);

    const viewport = screen.getByTestId('week-grid');
    const grid = within(viewport).getByTestId('week-grid-columns');
    expect(grid).toHaveClass('shell:w-full', 'shell:min-w-0', 'grid-cols-7');
    expect(within(grid).getAllByRole('article')).toHaveLength(7);
    within(grid)
      .getAllByRole('article')
      .forEach((day) =>
        expect(day).toHaveClass('shell:w-auto', 'shell:min-w-0')
      );
  });
});
