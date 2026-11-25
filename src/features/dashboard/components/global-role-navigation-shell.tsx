'use client';

import type { ReactNode } from 'react';

import { useSession } from '@/providers/session/session-context';
import { cn } from '@/shared/lib';
import { isMvpHShellEnabled } from '@/shared/lib/mvp-h-slice';

import { RoleBottomNavigation } from './role-bottom-navigation';

export const GlobalRoleNavigationShell = ({
  children,
}: {
  children: ReactNode;
}) => {
  const session = useSession();
  const role = session.member?.role;

  // mvp-h shell: 켜면 학생·선생님의 하단 메뉴는 OdokgongShell 의 하단 탭이 그린다.
  if (
    isMvpHShellEnabled() &&
    (role === 'ROLE_STUDENT' || role === 'ROLE_TEACHER')
  ) {
    return <>{children}</>;
  }

  return (
    <>
      <div
        className={cn(
          'mt-header-height flex flex-col',
          role === 'ROLE_STUDENT' &&
            'shell:pb-0 pb-[calc(var(--spacing-control-xl)+var(--spacing-section-gap-mobile)+env(safe-area-inset-bottom))]',
          (role === 'ROLE_TEACHER' || role === 'ROLE_PARENT') &&
            'tablet:pb-0 pb-[calc(var(--spacing-control-xl)+var(--spacing-section-gap-mobile)+env(safe-area-inset-bottom))]'
        )}
        data-root-content
      >
        {children}
      </div>
      <RoleBottomNavigation role={role} />
    </>
  );
};
