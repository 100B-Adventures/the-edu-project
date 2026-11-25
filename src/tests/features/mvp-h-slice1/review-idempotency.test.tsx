import type { ReactNode } from 'react';

import { useImportProblemsMutation } from '@/features/review/hooks/use-review';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock('@/shared/api', () => ({
  api: { private: { get: vi.fn(), post: mocks.post } },
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider
    client={
      new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    }
  >
    {children}
  </QueryClientProvider>
);

const IMPORT_BODY = {
  channel: 'SOLVED_TODAY' as const,
  challengeAttemptIds: [21],
};
const IMPORT_RESPONSE = {
  status: 200,
  message: 'ok',
  data: { created: [], skippedDuplicates: [] },
};

const keyOf = (index: number) =>
  (mocks.post.mock.calls[index]![2] as { headers: Record<string, string> })
    .headers['Idempotency-Key'];

describe('시험 항목 S36 가져오기 요청의 멱등 키 (교차 리뷰 P1-6)', () => {
  beforeEach(() => mocks.post.mockReset());

  it('S36-1 실패한 가져오기를 다시 보내면 같은 키를 쓴다', async () => {
    mocks.post.mockRejectedValueOnce(new Error('net'));
    mocks.post.mockResolvedValueOnce(IMPORT_RESPONSE);
    const { result } = renderHook(() => useImportProblemsMutation(), {
      wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync(IMPORT_BODY).catch(() => undefined);
    });
    await act(async () => {
      await result.current.mutateAsync(IMPORT_BODY).catch(() => undefined);
    });
    expect(keyOf(0)).toMatch(/^imp-/);
    expect(keyOf(1)).toBe(keyOf(0));
  });

  it('S36-2 성공한 뒤의 다음 가져오기는 새 키를 쓴다(첫 응답을 되돌려받지 않는다)', async () => {
    mocks.post.mockResolvedValue(IMPORT_RESPONSE);
    const { result } = renderHook(() => useImportProblemsMutation(), {
      wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync(IMPORT_BODY).catch(() => undefined);
    });
    await act(async () => {
      await result.current.mutateAsync(IMPORT_BODY).catch(() => undefined);
    });
    expect(keyOf(1)).not.toBe(keyOf(0));
  });
});
