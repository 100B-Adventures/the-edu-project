import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PublicEntryCards } from './public-entry-cards';

vi.mock('@/features/app-shell/model/shell-capabilities', () => ({
  SHELL_CAPABILITIES: {
    levelTest: true,
  },
}));

describe('PublicEntryCards level capability', () => {
  it('S7-홈-5 levelTest를 명시적으로 켜면 레벨 테스트 실제 주소를 연결한다', () => {
    render(<PublicEntryCards />);

    expect(
      screen
        .getByRole('link', { name: '레벨 테스트 받기' })
        .getAttribute('href')
    ).toBe('/level');
  });
});
