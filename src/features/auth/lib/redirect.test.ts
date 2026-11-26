import { describe, expect, test } from 'vitest';

import {
  buildPostSignupLoginQuery,
  resolveDashboardFromRedirect,
  resolveLoginDestination,
  resolveOAuthFrom,
  resolveRoleDestination,
  resolveSessionLoginDestination,
  sanitizeRedirect,
} from './redirect';

describe('resolveRoleDestination', () => {
  test('T-MVPH-LOGIN-1 셸을 켠 학생은 승인 시안의 내 학습 첫 화면으로 간다', () => {
    expect(resolveRoleDestination('ROLE_STUDENT', true)).toBe(
      '/dashboard/student'
    );
  });

  test('T-MVPH-LOGIN-2 셸을 끈 학생과 교사의 기존 착지는 바뀌지 않는다', () => {
    expect(resolveRoleDestination('ROLE_STUDENT', false)).toBe('/learning');
    expect(resolveRoleDestination('ROLE_TEACHER', true)).toBe('/dashboard');
    expect(resolveRoleDestination('ROLE_TEACHER', false)).toBe('/dashboard');
  });
});

describe('sanitizeRedirect', () => {
  test('앱 내부 절대경로는 그대로 허용한다', () => {
    expect(sanitizeRedirect('/invite/challenge/abc123')).toBe(
      '/invite/challenge/abc123'
    );
  });

  test('null/undefined/빈 문자열은 null', () => {
    expect(sanitizeRedirect(null)).toBeNull();
    expect(sanitizeRedirect(undefined)).toBeNull();
    expect(sanitizeRedirect('')).toBeNull();
  });

  test('프로토콜 상대경로(//)는 오픈 리다이렉트로 간주해 차단', () => {
    expect(sanitizeRedirect('//evil.com')).toBeNull();
  });

  test('외부 절대 URL(http/https)은 차단', () => {
    expect(sanitizeRedirect('https://evil.com')).toBeNull();
    expect(sanitizeRedirect('http://evil.com/path')).toBeNull();
  });

  test('백슬래시 트릭은 차단', () => {
    expect(sanitizeRedirect('/\\evil.com')).toBeNull();
  });
});

describe('resolveLoginDestination', () => {
  test('ROLE_MEMBER(프로필 미완성) + redirect 있음 → select-role 로 redirect 를 쿼리로 들고 간다', () => {
    const dest = resolveLoginDestination({
      role: 'ROLE_MEMBER',
      redirectTo: '/invite/challenge/abc123',
      roleDest: '/dashboard',
    });
    expect(dest).toBe(
      `/select-role?redirect=${encodeURIComponent('/invite/challenge/abc123')}`
    );
  });

  test('ROLE_MEMBER + redirect 없음 → select-role 만', () => {
    const dest = resolveLoginDestination({
      role: 'ROLE_MEMBER',
      redirectTo: null,
      roleDest: '/dashboard',
    });
    expect(dest).toBe('/select-role');
  });

  test('일반 역할 + 안전한 redirect 있음 → redirect 우선', () => {
    const dest = resolveLoginDestination({
      role: 'ROLE_STUDENT',
      redirectTo: '/invite/challenge/abc123',
      roleDest: '/learning',
    });
    expect(dest).toBe('/invite/challenge/abc123');
  });

  test('일반 역할 + redirect 없음 → 역할별 기본 랜딩(roleDest)', () => {
    const dest = resolveLoginDestination({
      role: 'ROLE_STUDENT',
      redirectTo: null,
      roleDest: '/learning',
    });
    expect(dest).toBe('/learning');
  });

  test('일반 역할 + 안전하지 않은 redirect(외부 URL) → roleDest 로 폴백(오픈 리다이렉트 차단)', () => {
    const dest = resolveLoginDestination({
      role: 'ROLE_TEACHER',
      redirectTo: 'https://evil.com',
      roleDest: '/dashboard',
    });
    expect(dest).toBe('/dashboard');
  });
});

describe('resolveOAuthFrom', () => {
  test('redirect만 있으면(도전장 카카오 로그인) redirect를 from 자리로 승계한다', () => {
    expect(
      resolveOAuthFrom({ from: null, redirect: '/invite/challenge/abc123' })
    ).toBe('/invite/challenge/abc123');
  });

  test('from이 이미 있으면(스터디룸 초대 등 기존 흐름) from을 우선한다', () => {
    expect(
      resolveOAuthFrom({
        from: '/study-rooms/1',
        redirect: '/invite/challenge/abc123',
      })
    ).toBe('/study-rooms/1');
  });

  test('redirect가 안전하지 않은 외부 URL이면 차단(오픈 리다이렉트 가드)', () => {
    expect(
      resolveOAuthFrom({ from: null, redirect: 'https://evil.com' })
    ).toBeNull();
  });

  test('둘 다 없으면 null', () => {
    expect(resolveOAuthFrom({ from: null, redirect: null })).toBeNull();
  });
});

describe('resolveSessionLoginDestination', () => {
  test('T-MVPH-LOGIN-3 세션 감지 경로도 셸 ON/OFF 학생 착지를 같은 규칙으로 쓴다', () => {
    expect(
      resolveSessionLoginDestination({ role: 'ROLE_STUDENT', shellEnabled: true })
    ).toBe('/dashboard/student');
    expect(
      resolveSessionLoginDestination({ role: 'ROLE_STUDENT', shellEnabled: false })
    ).toBe('/learning');
  });

  test('로그인 URL의 내부 redirect를 세션 갱신 경로에서도 우선한다', () => {
    expect(
      resolveSessionLoginDestination({
        role: 'ROLE_STUDENT',
        token: null,
        redirect: '/points',
        from: null,
      })
    ).toBe('/points');
  });

  test('외부 redirect는 차단하고 역할별 내부 기본 경로로 이동한다', () => {
    expect(
      resolveSessionLoginDestination({
        role: 'ROLE_STUDENT',
        token: null,
        redirect: 'https://evil.example.com',
        from: null,
      })
    ).toBe('/learning');
  });

  test('기존 from 내부 경로와 초대 token 우선순위를 보존한다', () => {
    expect(
      resolveSessionLoginDestination({
        role: 'ROLE_TEACHER',
        token: null,
        redirect: null,
        from: '/study-rooms/477',
      })
    ).toBe('/study-rooms/477');

    expect(
      resolveSessionLoginDestination({
        role: 'ROLE_MEMBER',
        token: 'invite-token',
        redirect: '/points',
        from: null,
      })
    ).toBe('/dashboard?token=invite-token');
  });
});

describe('resolveDashboardFromRedirect', () => {
  test('인코딩된 내부 경로는 디코딩 후 반환한다(기존 카카오 회원 대시보드 복귀)', () => {
    expect(
      resolveDashboardFromRedirect(
        encodeURIComponent('/invite/challenge/abc123')
      )
    ).toBe('/invite/challenge/abc123');
  });

  test('null/undefined/빈 문자열은 null', () => {
    expect(resolveDashboardFromRedirect(null)).toBeNull();
    expect(resolveDashboardFromRedirect(undefined)).toBeNull();
    expect(resolveDashboardFromRedirect('')).toBeNull();
  });

  test('프로토콜 상대경로(//)는 디코딩 후에도 오픈 리다이렉트로 차단', () => {
    expect(
      resolveDashboardFromRedirect(encodeURIComponent('//evil.com'))
    ).toBeNull();
  });

  test('외부 절대 URL은 차단', () => {
    expect(
      resolveDashboardFromRedirect(encodeURIComponent('https://evil.com'))
    ).toBeNull();
  });

  test('잘못된 % 인코딩 시퀀스는 예외 없이 null', () => {
    expect(resolveDashboardFromRedirect('%')).toBeNull();
  });
});

describe('buildPostSignupLoginQuery', () => {
  test('token(스터디룸 초대)·from·redirect(도전장 복귀)를 모두 담는다', () => {
    const query = buildPostSignupLoginQuery({
      inviteToken: 'study-token-1',
      from: '/study-rooms/1',
      redirect: '/invite/challenge/abc123',
    });
    const params = new URLSearchParams(query);
    expect(params.get('token')).toBe('study-token-1');
    expect(params.get('from')).toBe('/study-rooms/1');
    expect(params.get('redirect')).toBe('/invite/challenge/abc123');
  });

  test('redirect 만 있는 경우(도전장 전용 플로우) — token/from 없이도 유실 없이 전달', () => {
    const query = buildPostSignupLoginQuery({
      inviteToken: null,
      from: null,
      redirect: '/invite/challenge/abc123',
    });
    expect(query).toBe(
      `redirect=${encodeURIComponent('/invite/challenge/abc123')}`
    );
  });

  test('전부 없으면 빈 쿼리스트링', () => {
    expect(
      buildPostSignupLoginQuery({
        inviteToken: null,
        from: null,
        redirect: null,
      })
    ).toBe('');
  });
});
