import { ConditionComingSoon } from '@/features/solution-note/components/condition-coming-soon';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('MVP-H 조각 2 조건해석', () => {
  it('T-COND-1 준비 중 안내 한 장만 보이고 입력은 없다', () => {
    const { container } = render(<ConditionComingSoon />);

    expect(screen.getByText('조건해석은 준비 중이에요')).toBeVisible();
    expect(container.querySelectorAll('input, textarea, select')).toHaveLength(0);
    expect(container.querySelectorAll('[data-condition-card]')).toHaveLength(1);
  });
});
