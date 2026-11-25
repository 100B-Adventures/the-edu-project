'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/shared/lib';

import type { NavItem } from '../model/nav-config';
import { NavIcon } from './nav-icon';

/** 1024 미만(태블릿 포함)의 하단 탭. 높이 64. 탭 수만큼 같은 폭으로 나눈다. */
export const AppTabBar = ({ items }: { items: NavItem[] }) => {
  const pathname = usePathname();
  return (
    <nav
      aria-label="모바일 주요 메뉴"
      className="border-gray-3 bg-gray-white min-h-odok-tabbar-height shell:hidden fixed right-0 bottom-0 left-0 z-(--z-layer-chrome) flex border-t pb-[env(safe-area-inset-bottom)]"
      data-testid="odok-tab-bar"
    >
      {items.map((item) => {
        const active = item.match.test(pathname);
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'min-h-odok-tabbar-height gap-inline-gap-xs text-ui-compact flex flex-1 flex-col items-center justify-center font-bold transition-colors duration-100 active:opacity-90',
              active ? 'text-orange-9' : 'text-gray-8'
            )}
          >
            <NavIcon
              name={item.icon}
              className="size-5"
            />
            {item.tabLabel ?? item.label}
          </Link>
        );
      })}
    </nav>
  );
};
