'use client';

import { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { SHELL_CAPABILITIES } from '@/features/app-shell/model/shell-capabilities';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { NotificationPopover } from '@/features/notifications/components/notification-popover';
import { useMyPointWalletQuery } from '@/features/point/hooks/use-point';
import { useProfileImage } from '@/features/profile-image/hooks/use-profile-image';
import { HomeIcon } from '@/shared/components/icons';
import { DropdownMenu } from '@/shared/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverItem,
  PopoverLink,
  PopoverNav,
  PopoverSeparator,
  PopoverTrigger,
} from '@/shared/components/ui/popover';
import {
  BUTTON_BASE,
  DEFAULT_PROFILE_IMAGE,
  PRIVATE,
  PUBLIC,
  ROLE_META_MAP,
  getProfileImageSrc,
  link,
} from '@/shared/constants';
import { cn } from '@/shared/lib';
import {
  trackGnbLogoClick,
  trackGnbLogoutClick,
  trackGnbMenuClick,
  trackGnbProfileClick,
} from '@/shared/lib/analytics';
import { isMvpHShellEnabled } from '@/shared/lib/mvp-h-slice';
import { useMemberStore } from '@/store';

import {
  shouldShowDesktopDiscoveryLinks,
  shouldShowMobileDiscoveryLinks,
} from './header-policy';

const SHELL_DISCOVERY_LINKS: ReadonlyArray<readonly [string, string]> = [
  ['58일 프로그램', '/courses'],
  ['커뮤니티', '/community'],
  ['전자책', '/library'],
  ['고민상담', '/consult'],
  ...(SHELL_CAPABILITIES.levelTest
    ? ([['58일 레벨 테스트', '/level']] as const)
    : []),
];

/* 포인트 칩(R-13) — "내 학습" 셸(친구·트리·학습)엔 이미 상시 노출되는데
 * 오픈챌린지 랜딩 셸(이 GNB)만 없었다. QA 정합표(docs/qa/design-conformance-matrix.md
 * D-10-4·R-13 행)가 확정한 갭. 로그인 상태에서만 조회·노출한다. */
const HeaderPointChip = ({ enabled }: { enabled: boolean }) => {
  const { data: wallet } = useMyPointWalletQuery({ enabled });
  if (!enabled || wallet == null) return null;

  return (
    <span className="border-gray-9 text-gray-white desktop:flex hidden items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold">
      포인트 <b className="tabular-nums">{wallet.balance.toLocaleString()}</b>P
    </span>
  );
};

export const Header = () => {
  const session = useMemberStore((s) => s.member);
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const shellOn = isMvpHShellEnabled();
  const { data: profileImageData } = useProfileImage({
    enabled: !!session,
  });
  const profileImageSrc = getProfileImageSrc(
    profileImageData?.imageUrl,
    DEFAULT_PROFILE_IMAGE.HEADER
  );
  const showMobileDiscoveryLinks = shouldShowMobileDiscoveryLinks(
    session?.role
  );
  const showDesktopDiscoveryLinks = shouldShowDesktopDiscoveryLinks(
    session?.role
  );

  const goToMypage = () => {
    router.push('/mypage');
  };

  const { logout } = useAuth();
  const handleLogout = () => {
    logout();
    trackGnbLogoutClick(session?.role ?? null);
  };

  return (
    <header
      className="h-header-height bg-gray-12 px-section-gap shell:px-8 fixed top-0 right-0 left-0 z-50 flex min-w-0 items-center border-b border-gray-200"
      data-global-header
    >
      <div className="mx-auto flex w-full min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href={PUBLIC.CORE.INDEX}
            className="min-h-touch-min shell:min-h-0 inline-flex items-center"
            onClick={() => {
              // GNB 로고 클릭 → 포털 홈('/'). 마케팅 랜딩(/welcome)은 별도 진입.
              trackGnbLogoClick(session?.role ?? null);
            }}
          >
            <Image
              src={'/logo.svg'}
              alt="디에듀 로고"
              width={79}
              height={22}
              className="shrink-0 cursor-pointer"
            />
          </Link>
          <Image
            src={'/img_header_beta.svg'}
            alt="BETA"
            width={44}
            height={20}
          />

          {showDesktopDiscoveryLinks && shellOn && (
            <nav
              aria-label="오독공 둘러보기"
              className="ml-5 flex min-w-0 gap-2"
            >
              {SHELL_DISCOVERY_LINKS.map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  className={cn(
                    'max-desktop:hidden rounded-xl px-2.5 py-2 text-white',
                    pathname.startsWith(href)
                      ? 'bg-gray-11'
                      : 'hover:bg-gray-11'
                  )}
                >
                  {label}
                </Link>
              ))}
            </nav>
          )}

          {showDesktopDiscoveryLinks && !shellOn && (
            <div className="ml-5 flex min-w-0 gap-2">
              <Link
                href={PUBLIC.OPEN_CHALLENGE.LIST}
                className={cn(
                  'max-desktop:hidden rounded-xl px-2.5 py-2 text-white',
                  pathname === '/' || pathname.startsWith('/open-challenge')
                    ? 'bg-gray-11'
                    : 'hover:bg-gray-11'
                )}
              >
                오픈챌린지
              </Link>
              <Link
                href={PUBLIC.COURSE.LIST}
                className={cn(
                  'max-desktop:hidden rounded-xl px-2.5 py-2 text-white',
                  pathname.startsWith(PUBLIC.COURSE.LIST)
                    ? 'bg-gray-11'
                    : 'hover:bg-gray-11'
                )}
              >
                코스
              </Link>
              <Link
                href={PUBLIC.TEACHERS.LIST}
                className={cn(
                  'max-desktop:hidden rounded-xl px-2.5 py-2 text-white',
                  pathname.startsWith(PUBLIC.TEACHERS.LIST)
                    ? 'bg-gray-11'
                    : 'hover:bg-gray-11'
                )}
              >
                대표 멘토
              </Link>
              <Link
                href={PUBLIC.CONSULT.INDEX}
                className={cn(
                  'max-desktop:hidden rounded-xl px-2.5 py-2 text-white',
                  pathname.startsWith(PUBLIC.CONSULT.INDEX)
                    ? 'bg-gray-11'
                    : 'hover:bg-gray-11'
                )}
              >
                상담소
              </Link>
              <Link
                href={PUBLIC.COMMUNITY.COLUMN.LIST}
                className={cn(
                  'max-desktop:hidden rounded-xl px-2.5 py-2 text-white',
                  pathname.startsWith(PUBLIC.COMMUNITY.BASE)
                    ? 'bg-gray-11'
                    : 'hover:bg-gray-11'
                )}
              >
                게시판
              </Link>
            </div>
          )}
        </div>

        {session && (
          <div className="desktop:gap-4 flex shrink-0 items-center gap-1">
            <HeaderPointChip
              enabled={
                session.role !== 'ROLE_ADMIN' && session.role !== 'ROLE_STUDENT'
              }
            />
            <NotificationPopover />

            <DropdownMenu>
              <DropdownMenu.Trigger
                className="flex cursor-pointer items-center justify-center"
                onClick={() => {
                  // GNB 프로필 조회 클릭 이벤트 전송
                  trackGnbProfileClick(session?.role ?? null);
                }}
              >
                <Image
                  src={profileImageSrc}
                  alt="프로필 사진"
                  width={36}
                  height={36}
                  className="desktop:flex hidden h-9 w-9 cursor-pointer rounded-full object-cover"
                />
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Item
                  className="justify-self-center"
                  onClick={() => goToMypage()}
                >
                  마이페이지
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="justify-self-center"
                  onClick={() => router.push(PRIVATE.SETTINGS)}
                >
                  환경설정
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="text-system-warning justify-self-center"
                  onClick={() => handleLogout()}
                >
                  로그아웃
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu>

            {session?.role && (
              <div className="text-gray-white desktop:flex hidden items-center rounded-[40px] border px-2 py-[2px] text-[12px] font-[400px]">
                {ROLE_META_MAP[session.role]?.label}
              </div>
            )}

            <Popover
              open={isOpen}
              onOpenChange={setIsOpen}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="햄버거 메뉴"
                  className="desktop:hidden flex h-11 w-11 items-center justify-center rounded-lg transition-colors hover:bg-gray-800"
                  onClick={() => {
                    trackGnbMenuClick(session?.role ?? null);
                  }}
                >
                  <Image
                    src={'/ic_hamburger.svg'}
                    alt="햄버거 메뉴 아이콘"
                    width={24}
                    height={24}
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-[320px]"
              >
                <PopoverNav>
                  {showMobileDiscoveryLinks && shellOn && (
                    <>
                      {SHELL_DISCOVERY_LINKS.map(([label, href]) => (
                        <PopoverLink
                          key={label}
                          href={href}
                          onClick={() => setIsOpen(false)}
                        >
                          <span>{label}</span>
                        </PopoverLink>
                      ))}
                      <PopoverSeparator />
                    </>
                  )}
                  {showMobileDiscoveryLinks && !shellOn && (
                    <>
                      <PopoverLink
                        href={PUBLIC.OPEN_CHALLENGE.LIST}
                        onClick={() => setIsOpen(false)}
                      >
                        <HomeIcon />
                        <span>오픈챌린지</span>
                      </PopoverLink>
                      <PopoverLink
                        href={PUBLIC.COURSE.LIST}
                        onClick={() => setIsOpen(false)}
                      >
                        <span>코스</span>
                      </PopoverLink>
                      <PopoverLink
                        href={PUBLIC.TEACHERS.LIST}
                        onClick={() => setIsOpen(false)}
                      >
                        <span>대표 멘토</span>
                      </PopoverLink>
                      <PopoverLink
                        href={PUBLIC.CONSULT.INDEX}
                        onClick={() => setIsOpen(false)}
                      >
                        <span>상담소</span>
                      </PopoverLink>
                      <PopoverLink
                        href={PUBLIC.COMMUNITY.COLUMN.LIST}
                        onClick={() => setIsOpen(false)}
                      >
                        <span>게시판</span>
                      </PopoverLink>
                      <PopoverSeparator />
                    </>
                  )}

                  {/* 프로필 정보 */}
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-3">
                      <Image
                        src={profileImageSrc}
                        alt="프로필 사진"
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          {session?.name || '사용자'}
                        </span>
                        {session?.role && (
                          <span className="text-xs text-gray-500">
                            {ROLE_META_MAP[session.role]?.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 액션 버튼들 */}
                  <div className="mt-2 flex flex-col gap-1">
                    <PopoverItem
                      onClick={() => {
                        goToMypage();
                        setIsOpen(false);
                      }}
                    >
                      마이페이지
                    </PopoverItem>
                    <PopoverItem
                      onClick={() => {
                        router.push(PRIVATE.SETTINGS);
                        setIsOpen(false);
                      }}
                    >
                      환경설정
                    </PopoverItem>
                    <PopoverItem
                      variant="danger"
                      onClick={() => {
                        handleLogout();
                        setIsOpen(false);
                      }}
                    >
                      로그아웃
                    </PopoverItem>
                  </div>

                  <div className="mt-2 flex flex-col gap-1">
                    <Link
                      href={link.kakao}
                      className="text-gray-scale-gray-30 flex items-center justify-end gap-1.5 text-sm font-semibold"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Image
                        src="/ic_question_mark.svg"
                        alt="피드백"
                        width={16}
                        height={16}
                      />
                      소중한 의견 보내기
                    </Link>
                  </div>
                </PopoverNav>
              </PopoverContent>
            </Popover>
          </div>
        )}

        {!session && (
          <div className="flex gap-2">
            <Link
              href={PUBLIC.CORE.LOGIN}
              className={cn(
                BUTTON_BASE,
                'border-gray-3 max-desktop:py-2 hover:bg-gray-10'
              )}
            >
              로그인
            </Link>
            <Link
              href={PUBLIC.CORE.SIGNUP}
              className={cn(
                BUTTON_BASE,
                'bg-key-color-primary border-gray-11 hover:bg-orange-6',
                'max-desktop:hidden'
              )}
            >
              디에듀 시작하기
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
