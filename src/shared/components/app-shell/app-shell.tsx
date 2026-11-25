'use client';

import { OdokgongShell } from '@/features/app-shell/components/odokgong-shell';
import { DashboardSidebar } from '@/features/dashboard/components/dashboard-sidebar';
import { useSession } from '@/providers';
import { cn } from '@/shared/lib';
import { isMvpHShellEnabled } from '@/shared/lib/mvp-h-slice';

/**
 * 공개(비회원도 접근 가능) 페이지를 위한 조건부 사이드바 셸.
 *
 * - 로그인 상태(`authenticated`)면 회원 화면처럼 `DashboardSidebar`로 감싼다.
 * - 비로그인이면 children을 그대로 렌더(기존 공개 뷰 유지).
 * - SessionGuard와 달리 강제 redirect를 하지 않는다(공개 페이지는 비로그인도 봐야 함).
 *
 * 사이드바는 `fixed` 포지션이므로, 본문은 로그인 시에만 오프셋한다.
 * 사이드바가 `md`(768px)부터 보이므로(`Sidebar.Root`의 `md:flex`), 오프셋도 같은 지점(`tablet`
 * 커스텀 브레이크포인트, 값은 md와 같은 768px)에서 시작해야 태블릿 폭에서 본문이 사이드바에
 * 덮이지 않는다(실측 결함: mvp-e-v1.1.0-풀이화면-v2, 2026-08-18).
 * `md:`가 아니라 `tablet:`을 쓰는 이유: Tailwind v4 컴파일 결과에서 커스텀 브레이크포인트
 * (`tablet`·`desktop`)끼리는 값 오름차순으로 정렬되지만, 내장 `md`는 그 그룹 밖에 별도로
 * 정렬돼 소스 순서상 `desktop:` 규칙보다 뒤에 온다. `md:pl-...`와 `desktop:pl-...`를 같이 쓰면
 * 1200px 이상에서도 나중에 나온 `md:` 규칙이 이겨 데스크톱에서 레일 폭(72px)이 남는 사고가
 * 실제로 재현됐다(Playwright 838/1440 실측, 아래 회수 항목 없이 이 파일 안에서 자체 발견·수정).
 * `tablet:pl-sidebar-rail-width desktop:pl-sidebar-width`처럼 커스텀 브레이크포인트끼리만
 * 짝을 지으면 소스 순서가 값 순서와 일치해 정상적으로 오버라이드된다.
 * 태블릿(tablet~desktop 미만)은 아이콘 레일(`sidebar-rail-width` 72px), desktop 이상은 전체
 * 사이드바(`sidebar-width` 260px) 폭으로 오프셋한다 — `Sidebar.Root`의 반응형 폭과 항상 짝을 맞춘다.
 * 본문 랜드마크(`<main>`)는 각 페이지가 소유하므로 셸은 `<div>`로 감싼다(중첩 main 방지).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { member, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const role = member?.role;

  // mvp-h shell: 켜면 로그인한 학생·선생님은 새 앱 틀. 비로그인·학부모·관리자는 아래 기존 틀.
  if (
    isMvpHShellEnabled() &&
    isAuthenticated &&
    (role === 'ROLE_STUDENT' || role === 'ROLE_TEACHER')
  ) {
    return <OdokgongShell role={role}>{children}</OdokgongShell>;
  }

  return (
    <div
      className={cn(
        'transition-all duration-300',
        isAuthenticated && role === 'ROLE_STUDENT'
          ? 'shell:pl-sidebar-width'
          : isAuthenticated &&
              (role === 'ROLE_TEACHER' || role === 'ROLE_PARENT')
            ? 'tablet:pl-sidebar-rail-width desktop:pl-sidebar-width'
            : isAuthenticated &&
              'shell:pl-sidebar-rail-width desktop:pl-sidebar-width'
      )}
    >
      {isAuthenticated && <DashboardSidebar />}
      {children}
    </div>
  );
}
