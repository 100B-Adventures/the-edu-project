import type { ReactNode } from 'react';

import { AppShell } from '@/shared/components/app-shell/app-shell';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/dynamic', () => ({
  default: () => () => null,
}));

vi.mock('@/providers', () => ({
  useSession: () => ({
    member: { role: 'ROLE_STUDENT' },
    status: 'authenticated',
  }),
}));

vi.mock('@/features/dashboard/components/dashboard-sidebar', () => ({
  DashboardSidebar: () => <aside data-testid="legacy-sidebar" />,
}));

vi.mock('@/features/app-shell/components/odokgong-shell', () => ({
  OdokgongShell: ({ children }: { children: ReactNode }) => (
    <div data-testid="odokgong-shell">{children}</div>
  ),
}));

describe('T-SHL-A6 앱 셸 첫 렌더', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it('셸 ON 로그인 사용자는 첫 렌더부터 본문과 새 셸을 함께 본다', () => {
    vi.stubEnv('NEXT_PUBLIC_MVPH_SHELL', 'on');

    render(<AppShell>첫 화면 본문</AppShell>);

    expect(screen.getByTestId('odokgong-shell')).toBeVisible();
    expect(screen.getByText('첫 화면 본문')).toBeVisible();
    expect(screen.queryByTestId('legacy-sidebar')).toBeNull();
  });
});
