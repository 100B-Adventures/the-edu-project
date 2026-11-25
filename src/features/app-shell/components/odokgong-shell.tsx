'use client';

import type { ReactNode } from 'react';

import { type ShellRole, useShellNav } from '../hooks/use-shell-nav';
import { AppSidebar } from './app-sidebar';
import { AppTabBar } from './app-tab-bar';
import { AppTopBar } from './app-top-bar';

type OdokgongShellProps = {
  role: ShellRole;
  children: ReactNode;
  /** 상세 화면이면 상단 바에 뒤로 버튼. */
  back?: boolean;
  /** 풀이 화면처럼 틀을 빼고 본문만 그릴 때. */
  bare?: boolean;
};

/**
 * 오독공 앱 틀(FDD v3.0.2 §5.1). 1024 이상은 왼쪽 사이드바 208 + 상단 바 64,
 * 미만(태블릿 포함)은 상단 바 56 + 하단 탭 64. 학생·선생님만 쓰고 학부모·관리자는 기존 틀이다.
 * 클래스 이름은 기존 AppShell(공개 페이지용)과 겹치지 않게 OdokgongShell 이다.
 */
export const OdokgongShell = ({
  role,
  children,
  back = false,
  bare = false,
}: OdokgongShellProps) => {
  const nav = useShellNav(role);

  if (bare) return <>{children}</>;

  return (
    <div
      className="bg-system-background shell:pl-odok-sidebar-width pb-odok-tabbar-height shell:pb-0 min-h-screen"
      data-odok-shell
      data-private-role={role}
    >
      <AppSidebar items={nav.sidebar} />
      <AppTopBar
        role={role}
        back={back}
      />
      <div className="w-full">{children}</div>
      <AppTabBar items={nav.tabs} />
    </div>
  );
};
