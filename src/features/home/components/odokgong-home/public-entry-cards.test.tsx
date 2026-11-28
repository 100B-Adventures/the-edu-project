import { slice3Repository } from '@/features/mvp-h-slice3/api/slice3.repository';
import { render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { OdokgongHome } from './odokgong-home';
import { PublicEntryCards } from './public-entry-cards';

vi.mock('@/providers/session/session-context', () => ({
  useSession: () => ({ member: null }),
}));

vi.mock('@/features/community/column/hooks/use-column-list', () => ({
  useColumnList: () => ({
    data: { content: [] },
    isLoading: false,
    isError: false,
  }),
}));

vi.mock('@/features/mvp-h-slice3/api/slice3.repository', () => ({
  slice3Repository: {
    feed: vi.fn().mockResolvedValue([]),
  },
}));

describe('PublicEntryCards', () => {
  it('S7-홈-3 기본 capability에서 58일 실제 주소를 연결하고 레벨 진입을 숨긴다', () => {
    render(<PublicEntryCards />);

    expect(
      screen.getByRole('heading', {
        name: /학원·인강에서 배운 걸\s+58일 동안 내 손으로 다시 씁니다/,
      })
    ).toBeTruthy();
    expect(
      screen
        .getByRole('link', { name: '58일 프로그램 보기' })
        .getAttribute('href')
    ).toBe('/courses');
    expect(screen.queryByRole('link', { name: '레벨 테스트 받기' })).toBeNull();
    expect(
      screen.getByRole('link', { name: '전자책 보기' }).getAttribute('href')
    ).toBe('/library');
    expect(
      screen.getByRole('link', { name: '고민상담 보기' }).getAttribute('href')
    ).toBe('/consult');
    expect(
      screen.getByRole('link', { name: '로그인하기' }).getAttribute('href')
    ).toBe('/login');
  });

  it('S7-홈-4 전체 홈은 실제 후기 0건에서 후기 영역과 가짜 후기를 그리지 않는다', async () => {
    render(<OdokgongHome />);

    await waitFor(() => {
      expect(slice3Repository.feed).toHaveBeenCalledTimes(2);
    });

    const home = screen.getByTestId('odokgong-home');

    expect(
      within(home).queryByText(/수강 후기|예시 후기예요|김학생|이학생|박학생/)
    ).toBeNull();
    expect(
      within(home).queryByRole('region', { name: '수강 후기' })
    ).toBeNull();
  });
});
