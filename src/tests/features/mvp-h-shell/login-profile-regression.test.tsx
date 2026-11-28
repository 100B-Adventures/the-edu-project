import { AppTopBar } from '@/features/app-shell/components/app-top-bar';
import { OdokgongLogin } from '@/features/auth/components/odokgong-login';
import { Header } from '@/layout/header';
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

vi.mock('@/store', () => ({
  useMemberStore: (selector: (state: { member: object }) => unknown) =>
    selector({
      member: {
        id: 7,
        name: '기존 학생',
        role: 'ROLE_MEMBER',
        email: 'legacy@example.com',
      },
    }),
}));

describe('MVP-H 로그인·상단 프로필 회귀', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
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

  it('REG-H-HEADER-OFF-01 셸 OFF 헤더는 기존 탐색·프로필 세 항목·카카오 의견 링크를 실제 렌더한다', async () => {
    vi.stubEnv('NEXT_PUBLIC_MVPH_SHELL', 'off');
    const user = userEvent.setup();
    render(<Header />);

    for (const label of [
      '오픈챌린지',
      '코스',
      '대표 멘토',
      '상담소',
      '게시판',
    ]) {
      expect(
        screen.getAllByRole('link', { name: label }).length
      ).toBeGreaterThan(0);
    }

    await user.click(screen.getByRole('button', { name: '프로필 사진' }));
    expect(screen.getByRole('menuitem', { name: '마이페이지' })).toBeVisible();
    expect(screen.getByRole('menuitem', { name: '환경설정' })).toBeVisible();
    expect(screen.getByRole('menuitem', { name: '로그아웃' })).toBeVisible();
    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('button', { name: '햄버거 메뉴' }));
    const feedback = screen.getByRole('link', {
      name: '피드백 소중한 의견 보내기',
    });
    expect(feedback).toBeVisible();
    expect(feedback).toHaveAttribute('target', '_blank');
    expect(feedback.getAttribute('href')).toContain('kakao');
  });

  it('REG-H-HEADER-ON-01 셸 ON 헤더는 오독공 브랜드와 승인 공개 진입만 연결한다', () => {
    vi.stubEnv('NEXT_PUBLIC_MVPH_SHELL', 'on');
    render(<Header />);

    expect(screen.getByRole('link', { name: '오독공' })).toHaveAttribute(
      'href',
      '/'
    );
    expect(screen.queryByAltText('디에듀 로고')).not.toBeInTheDocument();
    expect(screen.queryByAltText('BETA')).not.toBeInTheDocument();
    expect(
      screen
        .getAllByRole('link', { name: '58일 프로그램' })
        .every((entry) => entry.getAttribute('href') === '/courses')
    ).toBe(true);
    expect(
      screen.queryByRole('link', { name: '58일 레벨 테스트' })
    ).not.toBeInTheDocument();
  });
});
