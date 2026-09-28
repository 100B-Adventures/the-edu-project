import { describe, expect, it } from 'vitest';

import { getQueryClient } from './query-provider';

describe('QueryProvider SSR 캐시 격리', () => {
  it('SESSION-CACHE-01 서버 요청마다 별도 QueryClient를 만든다', () => {
    expect(getQueryClient(true)).not.toBe(getQueryClient(true));
  });

  it('SESSION-CACHE-02 브라우저에서는 렌더 사이에 같은 QueryClient를 유지한다', () => {
    expect(getQueryClient(false)).toBe(getQueryClient(false));
  });
});
