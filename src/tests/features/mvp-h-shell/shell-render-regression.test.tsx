import type { ReactNode } from 'react';

import StudyNoteLayout from '@/app/(private)/study-rooms/[id]/layout';
import { NoticePage } from '@/features/study-rooms/components/office/notice-page';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  pathname: '/study-rooms/1/homework/5',
  role: 'ROLE_STUDENT',
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
  usePathname: () => mocks.pathname,
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock('@/shared/hooks/use-role', () => ({
  useRole: () => ({ role: mocks.role, isLoading: false }),
}));

vi.mock('@/layout/column-layout', () => ({
  ColumnLayout: Object.assign(
    ({ children }: { children: ReactNode }) => (
      <div data-testid="column-layout">{children}</div>
    ),
    {
      Left: ({ children }: { children: ReactNode }) => (
        <aside>{children}</aside>
      ),
      Right: ({ children }: { children: ReactNode }) => (
        <section>{children}</section>
      ),
    }
  ),
}));

vi.mock('@/features/study-rooms/components/office/office-frame', () => ({
  OfficeFrame: ({ children }: { children: ReactNode }) => (
    <div data-testid="office-frame">{children}</div>
  ),
}));

vi.mock('@/features/study-rooms/components/office/notice-list', () => ({
  NoticeList: () => <div data-testid="notice-list" />,
}));

vi.mock('@/features/study-notes/components/study-note-tab', () => ({
  StudyNoteTab: () => null,
}));

vi.mock('@/features/study-notes/components/study-note-tab-shell', () => ({
  StudyNoteTabShell: () => null,
}));

vi.mock('@/features/study-rooms/components/sidebar', () => ({
  StudyroomSidebar: () => null,
}));

describe('mvp-h shell 렌더 회귀', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    mocks.pathname = '/study-rooms/1/homework/5';
    mocks.role = 'ROLE_STUDENT';
  });

  it('셀 OFF의 과제 상세는 기존 중첩 레이아웃에 맡기고 추가로 감싸지 않는다', () => {
    vi.stubEnv('NEXT_PUBLIC_MVPH_SHELL', 'off');

    render(
      <StudyNoteLayout>
        <div>기존 과제 상세</div>
      </StudyNoteLayout>
    );

    expect(screen.getByText('기존 과제 상세')).toBeVisible();
    expect(screen.queryByTestId('column-layout')).toBeNull();
    expect(screen.queryByTestId('office-frame')).toBeNull();
  });

  it('학부모의 공지 화면은 빈 화면 대신 권한 안내를 보여준다', () => {
    mocks.role = 'ROLE_PARENT';

    render(<NoticePage roomId={1} />);

    expect(
      screen.getByText('학생과 선생님만 공지를 볼 수 있어요')
    ).toBeVisible();
    expect(screen.queryByTestId('notice-list')).toBeNull();
  });
});
