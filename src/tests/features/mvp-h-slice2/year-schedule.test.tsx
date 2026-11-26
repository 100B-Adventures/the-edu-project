import { YearSchedule } from '@/features/schedule/components/year-schedule';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithQuery } from '../mvp-h-slice1/helpers';

vi.mock('@/features/schedule/hooks/use-schedule', () => ({
  useYearEventsQuery: () => ({
    data: [
      {
        id: 1,
        kind: 'EXAM',
        title: '기말고사',
        startsOn: `${new Date().getFullYear()}-12-12`,
        endsOn: null,
        targetGrade: null,
      },
    ],
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useYearEventMutations: () => ({
    create: { mutate: vi.fn(), isPending: false },
    remove: { mutate: vi.fn() },
  }),
}));

describe('MVP-H 조각 2 연간 일정', () => {
  it('T-SCH-7 이벤트 수와 무관하게 1월부터 12월까지 고정 행을 그린다', () => {
    renderWithQuery(<YearSchedule />);

    expect(screen.getAllByTestId('year-month-row')).toHaveLength(12);
    expect(screen.getByText('1월')).toBeVisible();
    expect(screen.getByText('12월')).toBeVisible();
    expect(screen.getByText('기말고사')).toBeVisible();
  });
});
