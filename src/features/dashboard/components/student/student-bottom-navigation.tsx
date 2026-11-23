'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useStudentDashboardStudyRoomListQuery } from '@/features/dashboard/hooks/use-student-dashboard-query';
import { PRIVATE } from '@/shared/constants';
import { cn } from '@/shared/lib';
import { isMvpHSliceEnabled } from '@/shared/lib/mvp-h-slice';
import {
  BookOpenCheck,
  ChartNoAxesCombined,
  GraduationCap,
  History,
  School,
  UserRound,
} from 'lucide-react';

const BASE_ITEMS = [
  {
    label: '학습',
    href: PRIVATE.DASHBOARD.STUDENT,
    match: /^\/dashboard\/student\/?$/,
    icon: GraduationCap,
  },
  {
    label: '성과',
    href: PRIVATE.DASHBOARD.STUDENT_RESULTS,
    match: /^\/dashboard\/student\/results\/?$/,
    icon: ChartNoAxesCombined,
  },
  {
    label: '회고',
    href: PRIVATE.DASHBOARD.STUDENT_LOOK_BACK,
    match: /^\/dashboard\/student\/look-back\/?$/,
    icon: History,
  },
  {
    label: '오답',
    href: PRIVATE.DASHBOARD.WRONG_ANSWERS,
    match: /^\/dashboard\/student\/wrong-answers(?:\/.*)?$/,
    icon: BookOpenCheck,
  },
  {
    label: '나',
    href: PRIVATE.MYPAGE,
    match: /^\/mypage\/?$/,
    icon: UserRound,
  },
] as const;

const REVIEW_ITEM = {
  label: 'N회독',
  href: PRIVATE.DASHBOARD.STUDENT_REVIEW,
  match: /^\/dashboard\/student\/review(?:\/.*)?$/,
  icon: BookOpenCheck,
} as const;

type StudentBottomNavigationViewProps = {
  pathname: string;
  primaryRoomId?: number;
};

export const StudentBottomNavigationView = ({
  pathname,
  primaryRoomId,
}: StudentBottomNavigationViewProps) => {
  const roomItem = primaryRoomId
    ? {
        label: '교무실',
        href: PRIVATE.ROOM.DETAIL(primaryRoomId),
        match: /^\/study-rooms\/\d+(?:\/.*)?$/,
        icon: School,
      }
    : null;
  // MVP-H slice 1: 켜져 있으면 오답 탭 자리에 N회독을 둔다(오답 회독은 N회독 안으로 들어간다).
  const baseItems = isMvpHSliceEnabled()
    ? BASE_ITEMS.map((item) => (item === BASE_ITEMS[3] ? REVIEW_ITEM : item))
    : BASE_ITEMS;
  const items = roomItem
    ? [baseItems[0], roomItem, ...baseItems.slice(1)]
    : baseItems;

  return (
    <nav
      aria-label="학생 모바일 주요 메뉴"
      className={cn(
        'border-gray-3 bg-gray-white min-h-control-xl shell:hidden fixed right-0 bottom-0 left-0 z-(--z-layer-chrome) grid border-t pb-[env(safe-area-inset-bottom)]',
        roomItem ? 'grid-cols-6' : 'grid-cols-5'
      )}
      data-testid="student-bottom-navigation"
    >
      {items.map((item) => {
        const active = item.match.test(pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={item.href}
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'min-h-control-xl gap-inline-gap-xs text-ui-compact active:bg-orange-1 flex flex-col items-center justify-center font-bold transition-[color,background-color,opacity,transform] duration-100 active:opacity-90',
              active ? 'text-orange-9' : 'text-gray-8'
            )}
          >
            <Icon
              size={18}
              aria-hidden
            />
            <b
              aria-hidden="true"
              className="block leading-none"
            >
              {item.label}
            </b>
          </Link>
        );
      })}
    </nav>
  );
};

export const StudentBottomNavigation = () => {
  const pathname = usePathname() ?? '';
  const rooms = useStudentDashboardStudyRoomListQuery();

  return (
    <StudentBottomNavigationView
      pathname={pathname}
      primaryRoomId={rooms.data?.[0]?.id}
    />
  );
};
