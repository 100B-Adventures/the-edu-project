import { NextRequest } from 'next/server';

import { middleware } from '@/middleware';
import { afterEach, describe, expect, it, vi } from 'vitest';

const shellOnlyPaths = [
  '/community',
  '/community/notes/1',
  '/checkout?courseId=1&productId=12',
  '/community/notes/new',
  '/dashboard/student/program',
  '/dashboard/student/program/days/18',
  '/dashboard/teacher/best',
  '/declarations/new',
  '/pay-done?paymentKey=pay_test&orderId=order_test&amount=280000',
  '/level',
  '/library',
  '/library/3/chapters/1',
] as const;

const legacyPaths = [
  '/community/column',
  '/community/column/1',
  '/community/column/1/opengraph-image',
  '/dashboard',
  '/learning',
  '/login',
] as const;

describe('MVP-H 셸 비활성 미들웨어', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('F-OFF-ROUTE-1 셸 전용 주소 12개를 인증 처리 전에 모두 404로 닫는다', () => {
    vi.stubEnv('NEXT_PUBLIC_MVPH_SHELL', 'false');

    for (const path of shellOnlyPaths) {
      const response = middleware(
        new NextRequest(`http://localhost:3000${path}`)
      );
      expect(response.status, path).toBe(404);
    }
  });

  it('F-OFF-ROUTE-2 셸을 꺼도 기존 공개 주소는 통과시킨다', () => {
    vi.stubEnv('NEXT_PUBLIC_MVPH_SHELL', 'false');

    expect(
      middleware(new NextRequest('http://localhost:3000/')).status
    ).toBe(200);
  });

  it('F-OFF-ROUTE-3 셸을 켜면 신규 비공개 주소는 기존 인증 가드를 따른다', () => {
    vi.stubEnv('NEXT_PUBLIC_MVPH_SHELL', 'true');

    const response = middleware(
      new NextRequest('http://localhost:3000/dashboard/student/program')
    );
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login?from=%2Fdashboard');
  });

  it('F-OFF-ROUTE-4 셸을 꺼도 base에 있던 기존 6주소는 404로 막지 않는다', () => {
    vi.stubEnv('NEXT_PUBLIC_MVPH_SHELL', 'false');

    const blocked = legacyPaths.flatMap((path) => {
      const response = middleware(
        new NextRequest(`http://localhost:3000${path}`)
      );
      return response.status === 404 ? [{ path, status: response.status }] : [];
    });

    expect(blocked).toEqual([]);
  });
});
