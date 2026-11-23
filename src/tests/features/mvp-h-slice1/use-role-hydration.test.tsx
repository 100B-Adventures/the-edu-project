import { renderToString } from 'react-dom/server';

import { queryKey } from '@/shared/constants/query-key';
import { useRole } from '@/shared/hooks/use-role';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/member/api/member.api', () => ({
  fetchMemberInfo: vi.fn(async () => ({ role: 'ROLE_TEACHER' })),
}));

const Probe = () => {
  const { role, isLoading } = useRole();
  return <p data-testid="p">{`${role ?? 'none'}:${isLoading}`}</p>;
};

describe('시험 항목 S28 역할 훅의 하이드레이션 일치(M-7 후보 A)', () => {
  it('S28-1 서버 렌더는 캐시에 세션이 있어도 역할 없음·로딩 중으로 그린다', () => {
    const qc = new QueryClient();
    qc.setQueryData(queryKey.session, { role: 'ROLE_TEACHER' });
    const html = renderToString(
      <QueryClientProvider client={qc}>
        <Probe />
      </QueryClientProvider>
    );
    expect(html).toContain('none:true');
  });

  it('S28-2 클라이언트 전환(캐시에 세션 있음)은 깜빡임 없이 바로 실제 역할을 준다', () => {
    const qc = new QueryClient();
    qc.setQueryData(queryKey.session, { role: 'ROLE_TEACHER' });
    render(
      <QueryClientProvider client={qc}>
        <Probe />
      </QueryClientProvider>
    );
    expect(screen.getByTestId('p')).toHaveTextContent('ROLE_TEACHER:false');
  });
});
