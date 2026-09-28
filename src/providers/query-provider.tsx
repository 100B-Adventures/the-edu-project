'use client';

import type { ReactNode } from 'react';

import dynamic from 'next/dynamic';

import { isServer, QueryClient, QueryClientProvider } from '@tanstack/react-query';

const ReactQueryDevtools =
  process.env.NODE_ENV === 'development' &&
  dynamic(
    () =>
      import('@tanstack/react-query-devtools').then(
        (mod) => mod.ReactQueryDevtools
      ),
    { ssr: false }
  );

interface QueryProviderProps {
  children: ReactNode;
}

export const makeQueryClient = () => new QueryClient();

let browserQueryClient: QueryClient | undefined;

export const getQueryClient = (runningOnServer = isServer) => {
  if (runningOnServer) return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
};

export const QueryProvider = ({ children }: QueryProviderProps) => {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {ReactQueryDevtools ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  );
};
