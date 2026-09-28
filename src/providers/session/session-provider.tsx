'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';

import { useCurrentMember } from '@/providers/session/hooks/use-current-member';

import {
  SessionContextValue,
  SessionProviderContext,
  SessionStatus,
} from './session-context';

interface SessionProviderProps {
  children: ReactNode;
  initialHasSession: boolean;
}

type ResolveSessionStatusParams = {
  initialHasSession: boolean;
  hydrated: boolean;
  isPending: boolean;
  isError: boolean;
  hasMember: boolean;
};

export const resolveSessionStatus = ({
  initialHasSession,
  hydrated,
  isPending,
  isError,
  hasMember,
}: ResolveSessionStatusParams): SessionStatus => {
  if (initialHasSession && !hydrated) return 'loading';
  if (!initialHasSession && !hasMember) return 'unauthenticated';
  if (isPending) return 'loading';
  if (isError) return 'error';
  if (hasMember) return 'authenticated';
  return 'unauthenticated';
};

export const SessionProvider = ({
  children,
  initialHasSession,
}: SessionProviderProps) => {
  const [hydrated, setHydrated] = useState(false);
  const {
    data: member,
    isPending,
    isError,
    refetch,
  } = useCurrentMember(initialHasSession);

  useEffect(() => setHydrated(true), []);

  // 쿼리상태 변환
  const status: SessionStatus = useMemo(
    () =>
      resolveSessionStatus({
        initialHasSession,
        hydrated,
        isPending,
        isError,
        hasMember: Boolean(member),
      }),
    [initialHasSession, hydrated, isPending, isError, member]
  );

  // Context Value
  const value: SessionContextValue = useMemo(
    () => ({
      status: status,
      member: member || null,
      error: isError ? 'SESSION_ERROR' : null,
      refresh: async () => {
        const result = await refetch();
        return result.data || null;
      },
    }),
    [status, member, isError, refetch]
  );

  return (
    <SessionProviderContext.Provider value={value}>
      {children}
    </SessionProviderContext.Provider>
  );
};
