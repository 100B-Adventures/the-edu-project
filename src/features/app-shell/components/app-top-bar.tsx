'use client';

import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { NotificationPopover } from '@/features/notifications/components/notification-popover';
import { useMyPointWalletQuery } from '@/features/point/hooks/use-point';
import { useProfileImage } from '@/features/profile-image/hooks/use-profile-image';
import { Button } from '@/shared/components/ui/button';
import { DropdownMenu } from '@/shared/components/ui/dropdown-menu';
import {
  DEFAULT_PROFILE_IMAGE,
  PRIVATE,
  getProfileImageSrc,
} from '@/shared/constants';
import {
  trackGnbLogoutClick,
  trackGnbProfileClick,
} from '@/shared/lib/analytics';
import { ChevronLeft } from 'lucide-react';

import type { ShellRole } from '../hooks/use-shell-nav';
import { shellTitleForPath } from '../model/shell-title';
import { OdokLogo } from './odok-logo';

type AppTopBarProps = {
  role: ShellRole;
  /** 뒤로가기 화면(상세)이면 로고 대신 뒤로 버튼을 둔다. */
  back?: boolean;
};

/** 옛 전역 헤더가 선생님에게 보여주던 포인트 잔액을 새 셸에서도 보존한다. */
const AppTopBarPointChip = ({ enabled }: { enabled: boolean }) => {
  const { data: wallet } = useMyPointWalletQuery({ enabled });
  if (!enabled || wallet == null) return null;

  return (
    <span className="bg-gray-1 text-gray-9 text-ui-choice rounded-pill min-h-chip-min px-button-chip-x hidden items-center font-bold sm:inline-flex">
      포인트
      <b className="text-gray-12 ml-1 tabular-nums">
        {wallet.balance.toLocaleString()}P
      </b>
    </span>
  );
};

/** 상단 바. 데스크톱 64·모바일 56. 왼쪽 뒤로/로고, 가운데 제목, 오른쪽 종·아바타. */
export const AppTopBar = ({ role, back = false }: AppTopBarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: profileImage } = useProfileImage({ enabled: true });
  const { logout } = useAuth();
  const avatarHref =
    role === 'ROLE_TEACHER' ? PRIVATE.DASHBOARD.TEACHER_MY : PRIVATE.MYPAGE;
  const title = shellTitleForPath(pathname, role);

  const handleLogout = () => {
    logout();
    trackGnbLogoutClick(role);
  };

  return (
    <header
      className="bg-gray-white border-gray-3 h-odok-topbar-height-mobile shell:h-odok-topbar-height px-appbar-pad-x sticky top-0 z-(--z-layer-chrome) flex items-center justify-between border-b"
      data-testid="odok-top-bar"
    >
      <div className="gap-content-gap flex min-w-0 items-center">
        {back ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="뒤로"
            onClick={() => router.back()}
          >
            <ChevronLeft aria-hidden />
          </Button>
        ) : (
          <span className="shell:hidden">
            <OdokLogo />
          </span>
        )}
        <h1 className="font-headline2-heading text-gray-12 truncate">
          {title}
        </h1>
      </div>
      <div className="gap-content-gap flex items-center">
        <AppTopBarPointChip enabled={role === 'ROLE_TEACHER'} />
        <NotificationPopover />
        <DropdownMenu>
          <DropdownMenu.Trigger
            aria-label="내 정보"
            className="size-touch-min flex cursor-pointer items-center justify-center"
            onClick={() => trackGnbProfileClick(role)}
          >
            <Image
              src={getProfileImageSrc(
                profileImage?.imageUrl,
                DEFAULT_PROFILE_IMAGE.HEADER
              )}
              alt=""
              width={32}
              height={32}
              className="rounded-pill size-8 object-cover"
            />
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end">
            <DropdownMenu.Item onClick={() => router.push(avatarHref)}>
              마이페이지
            </DropdownMenu.Item>
            <DropdownMenu.Item onClick={() => router.push(PRIVATE.SETTINGS)}>
              환경설정
            </DropdownMenu.Item>
            <DropdownMenu.Item
              variant="danger"
              onClick={handleLogout}
            >
              로그아웃
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </div>
    </header>
  );
};
