'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/shared/lib';

import type { NavItem } from '../model/nav-config';
import { NavIcon } from './nav-icon';
import { OdokLogo } from './odok-logo';

/** 1024 이상에서만 보이는 왼쪽 사이드바(폭 208). 아래에서는 AppTabBar 가 대신한다. */
export const AppSidebar = ({ items }: { items: NavItem[] }) => {
  const pathname = usePathname();
  return (
    <aside
      className="bg-gray-white border-gray-3 px-sidebar-pad-x py-sidebar-pad-y w-odok-sidebar-width shell:flex fixed top-0 bottom-0 left-0 z-(--z-layer-chrome) hidden flex-col border-r"
      data-testid="odok-sidebar"
    >
      <Link
        href="/"
        className="min-h-touch-min mb-block-gap inline-flex items-center px-2"
      >
        <OdokLogo />
      </Link>
      <nav
        aria-label="주요 메뉴"
        className="gap-inline-gap flex flex-col"
      >
        {items.map((item) => {
          const active = item.match.test(pathname);
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'min-h-touch-min gap-content-gap rounded-row font-body2-heading flex items-center px-3 transition-colors duration-100',
                active
                  ? 'bg-orange-1 text-orange-9'
                  : 'text-gray-9 hover:bg-gray-1'
              )}
            >
              <NavIcon
                name={item.icon}
                className="size-5"
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
