import { NextRequest } from 'next/server';

import { middleware } from '@/middleware';
import { describe, expect, it } from 'vitest';

const post = (path: string) =>
  new NextRequest(`http://localhost:3000${path}`, { method: 'POST' });

describe('비로그인 회원가입 요청 middleware', () => {
  it('TC-V2023-MW-001 비로그인 POST /api/v1/auth/sign-up 은 로그인으로 돌리지 않고 통과한다', () => {
    const response = middleware(post('/api/v1/auth/sign-up'));
    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('TC-V2023-MW-002 비로그인 POST 다른 /api/v1/auth/* 경로는 여전히 로그인으로 돌린다', () => {
    const response = middleware(post('/api/v1/auth/logout'));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
  });

  it('TC-V2023-MW-003 비로그인 보호 경로는 여전히 로그인으로 돌린다', () => {
    const response = middleware(post('/api/v1/common/course-orders'));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
  });
});
