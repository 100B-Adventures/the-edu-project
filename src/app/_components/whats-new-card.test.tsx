import {
  LAST_SEEN_VERSION_KEY,
  WhatsNewCard,
  isWhatsNewBlockedRoute,
} from '@/app/_components/whats-new-card';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const navigation = vi.hoisted(() => ({ pathname: '/', search: '' }));
const track = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useSearchParams: () => new URLSearchParams(navigation.search),
}));

vi.mock('@/shared/lib/analytics', () => ({
  GA4_EVENTS: {
    WHATS_NEW_VIEW: 'whats_new_view',
    WHATS_NEW_TRY: 'whats_new_try',
    WHATS_NEW_FEEDBACK: 'whats_new_feedback',
    WHATS_NEW_DISMISS: 'whats_new_dismiss',
  },
  track,
}));

describe('새로운 기능 카드 계약', () => {
  beforeEach(() => {
    localStorage.clear();
    navigation.pathname = '/';
    navigation.search = '';
    track.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('WN-UNIT-001 정상: 최신 알림 버전을 첫 방문에 보여 주고 열람 처리한다', async () => {
    render(<WhatsNewCard />);
    expect(await screen.findByTestId('whats-new-card')).toBeInTheDocument();
    expect(localStorage.getItem(LAST_SEEN_VERSION_KEY)).toBe('v2.0.22');
    expect(track).toHaveBeenCalledWith('whats_new_view', {
      version: 'v2.0.22',
    });
  });

  it('WN-UNIT-002 거절: 같은 버전은 새로고침 뒤 다시 보여 주지 않는다', async () => {
    const first = render(<WhatsNewCard />);
    expect(await screen.findByTestId('whats-new-card')).toBeInTheDocument();
    first.unmount();

    render(<WhatsNewCard />);
    await waitFor(() => {
      expect(screen.queryByTestId('whats-new-card')).not.toBeInTheDocument();
    });
    expect(track).toHaveBeenCalledTimes(1);
  });

  it('WN-UNIT-003 정상: 닫으면 카드를 숨기고 dismiss 이벤트를 보낸다', async () => {
    render(<WhatsNewCard />);
    fireEvent.click(
      await screen.findByRole('button', { name: '새로운 기능 카드 닫기' })
    );
    expect(screen.queryByTestId('whats-new-card')).not.toBeInTheDocument();
    expect(track).toHaveBeenCalledWith('whats_new_dismiss', {
      version: 'v2.0.22',
    });
  });

  it.each([
    ['/login', ''],
    ['/register', ''],
    ['/welcome', ''],
    ['/onboarding', ''],
    ['/select-role', ''],
    ['/admin/members', ''],
    ['/invite/secret-token', ''],
    ['/friends/challenge/secret-token', ''],
    ['/about', '?token=secret-token'],
  ])('WN-UNIT-004 거절: 차단 주소 %s%s에서는 띄우지 않는다', (pathname, search) => {
    expect(isWhatsNewBlockedRoute(pathname, search)).toBe(true);
  });

  it('WN-UNIT-005 정상: 써 보기와 좋아요를 각각 GA4 이벤트로 보낸다', async () => {
    render(<WhatsNewCard />);

    const tryLink = await screen.findByRole('link', { name: '써 보기' });
    tryLink.addEventListener('click', (event) => event.preventDefault(), {
      once: true,
    });
    fireEvent.click(tryLink);
    fireEvent.click(screen.getByRole('button', { name: '좋아요' }));

    expect(track).toHaveBeenCalledWith('whats_new_try', {
      version: 'v2.0.22',
    });
    expect(track).toHaveBeenCalledWith('whats_new_feedback', {
      version: 'v2.0.22',
      value: 'like',
    });
    expect(screen.getByRole('status')).toHaveTextContent('의견을 남겼어요');
  });
});
