import { afterEach, describe, expect, it, vi } from 'vitest';

import { isTokenBearingUrl } from './ad-pixels';
import { ANALYTICS_BLOCKED_FLAG, tokenUrlGuardScript } from './token-url-guard';

const flags = window as unknown as Record<string, unknown>;

// 스크립트 본문은 전역 window 를 받는다. location·referrer 만 갈아 끼운 가짜를 넘겨 실행한다.
const run = (href: string, referrer = '') => {
  const assign = vi.fn();
  const replace = vi.fn();
  const pushState = vi.fn();
  const replaceState = vi.fn();
  const url = new URL(href);
  const fake: Record<string, unknown> = {
    location: { href, origin: url.origin, assign, replace },
    history: { pushState, replaceState },
  };
  const source = tokenUrlGuardScript().replace(/\(window\);$/, '(w);');
  new Function('w', 'document', source)(fake, { referrer });
  return { fake, assign, replace, pushState, replaceState };
};

const history = (fake: Record<string, unknown>) =>
  fake.history as {
    pushState: (s: unknown, n: string, u?: string) => void;
    replaceState: (s: unknown, n: string, u?: string) => void;
  };

describe('토큰 주소 차단 스크립트', () => {
  afterEach(() => {
    delete flags[ANALYTICS_BLOCKED_FLAG];
  });

  it.each([
    'https://hongong.today/invite/abc',
    'https://hongong.today/invite?token=abc',
    'https://hongong.today/invite/challenge/abc',
    'https://hongong.today/friends/challenge/abc/result',
    'https://hongong.today/register?token=abc',
    'https://hongong.today/open-challenge/1?inviteToken=abc',
    'https://hongong.today/select-role?redirect=%2Finvite%2Fchallenge%2Fabc',
    'https://hongong.today/login?from=%2Finvite%2Fabc',
    'https://hongong.today/login?redirect=%2Fregister%3Ftoken%3Dabc',
  ])('%s 은 분석을 끈다', (href) => {
    expect(run(href).fake[ANALYTICS_BLOCKED_FLAG]).toBe(true);
  });

  it.each([
    'https://hongong.today/',
    'https://hongong.today/dashboard/student',
    'https://hongong.today/learning',
    'https://hongong.today/invitee',
    'https://hongong.today/?utm_source=meta&fbclid=abc',
    'https://hongong.today/login?from=%2Fdashboard%2Fstudent',
    'https://hongong.today/login?redirect=%2F%2Fother.example%2Finvite%2Fabc',
  ])('%s 은 분석을 유지한다', (href) => {
    expect(run(href).fake[ANALYTICS_BLOCKED_FLAG]).toBeUndefined();
  });

  it('같은 출처 직전 페이지가 토큰 주소면 끄고, 다른 출처는 무시한다', () => {
    const home = 'https://hongong.today/';
    expect(
      run(home, 'https://hongong.today/invite/abc').fake[ANALYTICS_BLOCKED_FLAG]
    ).toBe(true);
    expect(
      run(home, 'https://other.example/invite/abc').fake[ANALYTICS_BLOCKED_FLAG]
    ).toBeUndefined();
  });

  it('SPA 로 토큰 주소에 가면 pushState 대신 전체 이동한다', () => {
    const { fake, assign, pushState } = run('https://hongong.today/');

    history(fake).pushState({}, '', '/invite/abc');

    expect(assign).toHaveBeenCalledWith('/invite/abc');
    expect(pushState).not.toHaveBeenCalled();
  });

  it('replaceState 도 같다', () => {
    const { fake, replace, replaceState } = run('https://hongong.today/');

    history(fake).replaceState({}, '', '/register?token=abc');

    expect(replace).toHaveBeenCalledWith('/register?token=abc');
    expect(replaceState).not.toHaveBeenCalled();
  });

  it('일반 이동과 주소 없는 history 호출은 그대로 통과시킨다', () => {
    const { fake, assign, pushState, replaceState } = run(
      'https://hongong.today/'
    );

    history(fake).pushState({}, '', '/courses');
    history(fake).replaceState({ a: 1 }, '');

    expect(pushState).toHaveBeenCalledTimes(1);
    expect(replaceState).toHaveBeenCalledTimes(1);
    expect(assign).not.toHaveBeenCalled();
  });

  it('이미 차단된 문서는 history 를 건드리지 않아 이동 반복이 없다', () => {
    const { fake, pushState } = run('https://hongong.today/invite/abc');

    expect(history(fake).pushState).toBe(pushState);
  });

  it('판정이 픽셀 쪽 기준과 같다', () => {
    for (const [path, search] of [
      ['/invite/abc', ''],
      ['/friends/challenge/a', ''],
      ['/courses', '?code=1'],
      ['/courses', ''],
      ['/select-role', '?redirect=%2Finvite%2Fchallenge%2Fabc'],
      ['/login', '?from=%2Fdashboard%2Fstudent'],
    ] as const) {
      const blocked = run(`https://hongong.today${path}${search}`).fake[
        ANALYTICS_BLOCKED_FLAG
      ];
      expect(Boolean(blocked)).toBe(isTokenBearingUrl(path, search));
    }
  });
});
