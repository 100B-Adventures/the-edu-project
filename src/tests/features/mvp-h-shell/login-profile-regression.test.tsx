import { AppTopBar } from '@/features/app-shell/components/app-top-bar';
import { OdokgongLogin } from '@/features/auth/components/odokgong-login';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  logout: vi.fn(),
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/learning',
  useRouter: () => ({
    back: vi.fn(),
    push: mocks.push,
  }),
}));

vi.mock('@/features/auth/components/login-form', () => ({
  default: () => <div data-testid="login-form">로그인 폼</div>,
}));

vi.mock('@/features/app-shell/components/odok-logo', () => ({
  OdokLogo: () => <span data-testid="odok-logo">오독공</span>,
}));

vi.mock('@/features/auth/hooks/use-auth', () => ({
  useAuth: () => ({ logout: mocks.logout }),
}));

vi.mock('@/features/notifications/components/notification-popover', () => ({
  NotificationPopover: () => <button type="button">알림</button>,
}));

vi.mock('@/features/profile-image/hooks/use-profile-image', () => ({
  useProfileImage: () => ({ data: null }),
}));

vi.mock('@/features/point/hooks/use-point', () => ({
  useMyPointWalletQuery: () => ({ data: { balance: 1200 } }),
}));

describe('MVP-H 로그인·상단 프로필 회귀', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('REG-H-LOGIN-01 기존 로그인 폼의 전체 폭·왼쪽 정렬을 보존하고 브랜드를 중복하지 않는다', () => {
    const { container } = render(<OdokgongLogin />);
    const wrapper = container.firstElementChild;

    expect(wrapper).toHaveClass('w-full');
    expect(wrapper).not.toHaveClass('items-center');
    expect(screen.queryByTestId('odok-logo')).not.toBeInTheDocument();
    expect(screen.getByTestId('login-form')).toBeVisible();
  });

  it('REG-H-PROFILE-01 아바타를 누르면 기존 세 항목 메뉴가 열린다', async () => {
    const user = userEvent.setup();
    render(<AppTopBar role="ROLE_STUDENT" />);

    const trigger = screen.getByRole('button', { name: '내 정보' });
    await user.click(trigger);

    expect(screen.getByRole('menuitem', { name: '마이페이지' })).toBeVisible();
    expect(screen.getByRole('menuitem', { name: '환경설정' })).toBeVisible();
    expect(screen.getByRole('menuitem', { name: '로그아웃' })).toBeVisible();
  });

  it('REG-H-PROFILE-02 로그아웃 메뉴가 기존 로그아웃 처리를 호출한다', async () => {
    const user = userEvent.setup();
    render(<AppTopBar role="ROLE_STUDENT" />);

    await user.click(screen.getByRole('button', { name: '내 정보' }));
    await user.click(screen.getByRole('menuitem', { name: '로그아웃' }));

    expect(mocks.logout).toHaveBeenCalledTimes(1);
  });

  it('REG-H-PROFILE-03 선생님 상단 바의 기존 포인트 진입 정보를 보존한다', () => {
    render(<AppTopBar role="ROLE_TEACHER" />);

    expect(screen.getByText('1,200P')).toBeVisible();
  });

  it('REG-H-PROFILE-04 선생님 상단 바의 이번 주 사용 한도를 보존한다', () => {
    render(<AppTopBar role="ROLE_TEACHER" />);

    expect(screen.getByText('이번 주 사용')).toBeVisible();
    expect(
      screen.getByText((_, element) =>
        Boolean(
          element?.tagName === 'B' &&
            element.textContent?.replace(/\s+/g, ' ').trim() === '0분 / 30분'
        )
      )
    ).toBeVisible();
  });
});
