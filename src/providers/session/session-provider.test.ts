import { act, createElement, type ComponentType } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import type { MemberDTO } from '@/entities/member';

import { useCurrentMember } from './hooks/use-current-member';
import { useSession } from './session-context';
import { resolveSessionStatus, SessionProvider } from './session-provider';

vi.mock('./hooks/use-current-member', () => ({
  useCurrentMember: vi.fn(),
}));

const member: MemberDTO = {
  id: 1,
  email: 'teacher@example.com',
  role: 'ROLE_TEACHER',
};

const SessionStatusProbe = () => {
  const { status } = useSession();
  return createElement('output', null, status);
};

const HydrationTestProvider = SessionProvider as ComponentType<{
  initialHasSession: boolean;
}>;

describe('SessionProvider hydration 계약', () => {
  it('SESSION-HYDRATION-01 로그인 쿠키가 있으면 hydration 전 서버·클라이언트를 loading으로 맞춘다', () => {
    expect(
      resolveSessionStatus({
        initialHasSession: true,
        hydrated: false,
        isPending: false,
        isError: false,
        hasMember: true,
      })
    ).toBe('loading');
  });

  it('SESSION-HYDRATION-02 hydration 뒤 회원 조회 오류를 authenticated로 오인하지 않는다', () => {
    expect(
      resolveSessionStatus({
        initialHasSession: true,
        hydrated: true,
        isPending: false,
        isError: true,
        hasMember: false,
      })
    ).toBe('error');
  });

  it('SESSION-HYDRATION-03 실제 hydration에서 첫 마크업을 맞춘 뒤 회원 상태를 공개한다', async () => {
    const reactEnvironment = globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean;
    };
    const previousActEnvironment = reactEnvironment.IS_REACT_ACT_ENVIRONMENT;
    reactEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
    vi.mocked(useCurrentMember).mockReturnValue({
      data: member,
      isPending: false,
      isError: false,
      refetch: vi.fn().mockResolvedValue({ data: member }),
    } as unknown as ReturnType<typeof useCurrentMember>);

    const element = createElement(
      HydrationTestProvider,
      { initialHasSession: true },
      createElement(SessionStatusProbe)
    );
    let root: Root | undefined;

    try {
      const serverMarkup = renderToString(element);
      const container = document.createElement('div');
      const recoverableErrors: unknown[] = [];

      expect(serverMarkup).toContain('loading');
      container.innerHTML = serverMarkup;

      await act(async () => {
        root = hydrateRoot(container, element, {
          onRecoverableError: (error) => recoverableErrors.push(error),
        });
      });

      expect(recoverableErrors).toEqual([]);
      expect(container).toHaveTextContent('authenticated');
    } finally {
      await act(async () => root?.unmount());
      reactEnvironment.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
    }
  });
});
