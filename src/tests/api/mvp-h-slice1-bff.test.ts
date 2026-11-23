import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: async () => ({ getAll: () => [] }),
}));

const call = async (
  method: 'POST' | 'GET',
  path: string[],
  init: { headers?: Record<string, string>; body?: string } = {}
) => {
  const route = await import('@/app/api/v1/[...path]/route');
  const { NextRequest } = await import('next/server');
  const request = new NextRequest(
    `https://dev.d-edu.site/api/v1/${path.join('/')}`,
    {
      method,
      headers: init.headers,
      body: init.body,
    }
  );
  return (method === 'POST' ? route.POST : route.GET)(request, {
    params: Promise.resolve({ path }),
  });
};

describe(
  '시험 항목 S20 BFF 가 멱등 키와 실패 data 를 지킨다',
  { timeout: 30_000 },
  () => {
    beforeEach(() => vi.resetModules());
    afterEach(() => vi.unstubAllGlobals());

    test('S20-5 Idempotency-Key 헤더를 백엔드로 그대로 전달한다', async () => {
      const fetchMock = vi.fn<
        (url: string, init: RequestInit) => Promise<Response>
      >(
        async () =>
          new Response(
            JSON.stringify({ status: 201, data: { solutionNoteId: 7 } }),
            {
              status: 201,
              headers: { 'Content-Type': 'application/json' },
            }
          )
      );
      vi.stubGlobal('fetch', fetchMock);
      await call('POST', ['student', 'solution-notes'], {
        headers: { 'Idempotency-Key': 'sn-11-21' },
        body: '{}',
      });
      const sent = fetchMock.mock.calls[0]![1].headers as Record<
        string,
        string
      >;
      expect(sent['Idempotency-Key']).toBe('sn-11-21');
    });

    test('S20-6 거절: 키가 없는 요청에는 키 헤더를 만들어 붙이지 않는다', async () => {
      const fetchMock = vi.fn<
        (url: string, init: RequestInit) => Promise<Response>
      >(
        async () =>
          new Response(JSON.stringify({ status: 200, data: {} }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
      );
      vi.stubGlobal('fetch', fetchMock);
      await call('GET', ['student', 'review', 'overview']);
      const sent = fetchMock.mock.calls[0]![1].headers as Record<
        string,
        string
      >;
      expect('Idempotency-Key' in sent).toBe(false);
    });

    test('S20-7 409 실패 응답의 data(기존 풀이노트 id)를 지우지 않는다', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(
          async () =>
            new Response(
              JSON.stringify({
                code: 'SOLUTION_NOTE_ALREADY_EXISTS',
                message: '이미 있어요',
                data: { solutionNoteId: 7 },
              }),
              { status: 409, headers: { 'Content-Type': 'application/json' } }
            )
        )
      );
      const response = await call('POST', ['student', 'solution-notes'], {
        body: '{}',
      });
      expect(response.status).toBe(409);
      expect(await response.json()).toEqual({
        code: 'SOLUTION_NOTE_ALREADY_EXISTS',
        message: '이미 있어요',
        data: { solutionNoteId: 7 },
      });
    });

    test('S20-8 data 가 없는 실패 응답은 기존 모양({ code, message })을 그대로 유지한다', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(
          async () =>
            new Response(
              JSON.stringify({ code: 'UNAUTHORIZED', message: '인증 필요' }),
              {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
              }
            )
        )
      );
      const response = await call('GET', ['student', 'review', 'overview']);
      expect(await response.json()).toEqual({
        code: 'UNAUTHORIZED',
        message: '인증 필요',
      });
    });
  }
);
