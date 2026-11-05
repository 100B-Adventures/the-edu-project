import { beforeEach, describe, expect, it } from 'vitest';

import {
  type AdSessionInput,
  isAdBlockedUrl,
  isAdTrackingAllowed,
  isUnder14ByBirthDate,
  mayBeUnder14ByBirthYear,
  metaPixelInitScript,
  syncExcludedBrowser,
} from './ad-pixels';

const anon: AdSessionInput = { status: 'unauthenticated' };
const member = (role: string, birthDate?: string): AdSessionInput => ({
  status: 'authenticated',
  role,
  birthDate,
});

const allowed = (
  path: string,
  session: AdSessionInput = anon,
  referrer = ''
) => {
  const url = new URL(path, 'https://hongong.today');
  return isAdTrackingAllowed({
    pathname: url.pathname,
    search: url.search,
    referrer,
    origin: url.origin,
    session,
    excludedBrowser: false,
  });
};

describe('광고 픽셀 제외 판정', () => {
  beforeEach(() => window.localStorage.clear());

  it.each([
    '/',
    '/welcome',
    '/register',
    '/courses',
    '/courses/3',
    '/consult',
    '/challenges',
    '/teachers',
    '/privacy/tracking',
    '/?utm_source=meta&fbclid=abc',
  ])('공개 화면 %s 은 비로그인에게 켠다', (path) => {
    expect(allowed(path)).toBe(true);
  });

  it.each([
    '/dashboard/student',
    '/dashboard/student/exam-hall',
    '/learning',
    '/tree',
    '/points',
    '/friends',
    '/friends/challenge/abc/result',
    '/onboarding',
    '/study-note/new',
    '/profile/student/12',
    '/open-challenge/3',
    '/courses/3/learn',
    '/invite',
    '/invite/abc',
    '/invite/challenge/abc',
    '/login',
    '/login?from=/dashboard/student',
    '/admin/members',
    '/register?token=abc',
    '/select-role?token=abc',
    '/open-challenge/1?inviteToken=abc',
  ])('%s 은 켜지 않는다', (path) => {
    expect(allowed(path)).toBe(false);
    expect(allowed(path, member('ROLE_TEACHER'))).toBe(false);
  });

  it('비슷한 이름의 경로를 잘못 막지 않는다', () => {
    expect(isAdBlockedUrl('/learning-guide', '')).toBe(false);
    expect(isAdBlockedUrl('/courses/3', '')).toBe(false);
    expect(isAdBlockedUrl('/invitee', '')).toBe(false);
  });

  it('학생은 공개 화면에서도 켜지 않는다', () => {
    expect(allowed('/', member('ROLE_STUDENT'))).toBe(false);
    expect(allowed('/courses', member('ROLE_STUDENT'))).toBe(false);
  });

  it('선생님·학부모 화면은 유지한다', () => {
    expect(allowed('/dashboard/teacher', member('ROLE_TEACHER'))).toBe(true);
    expect(allowed('/dashboard/parent', member('ROLE_PARENT'))).toBe(true);
    expect(allowed('/study-rooms/3/note', member('ROLE_TEACHER'))).toBe(true);
  });

  it('생년월일로 14세 미만이면 역할과 무관하게 켜지 않는다', () => {
    const now = new Date();
    const under = `${now.getFullYear() - 13}-01-01`;
    expect(allowed('/', member('ROLE_PARENT', under))).toBe(false);
  });

  it('모르는 역할, 관리자, 세션 오류는 켜지 않는다', () => {
    expect(allowed('/', member('ROLE_ADMIN'))).toBe(false);
    expect(allowed('/', { status: 'authenticated' })).toBe(false);
    expect(allowed('/', { status: 'error' })).toBe(false);
  });

  it('직전 페이지가 토큰 주소면 켜지 않는다', () => {
    const invite = 'https://hongong.today/invite/abc';
    expect(allowed('/', anon, invite)).toBe(false);
    expect(allowed('/', anon, 'https://hongong.today/login')).toBe(true);
    expect(allowed('/', anon, 'https://other.example/invite/abc')).toBe(true);
    expect(allowed('/', anon, 'not a url')).toBe(true);
  });

  it('학생이 로그아웃한 브라우저는 선생님·학부모 로그인 전까지 제외한다', () => {
    const input = {
      pathname: '/',
      search: '',
      referrer: '',
      origin: 'https://hongong.today',
      session: anon,
    };

    syncExcludedBrowser(member('ROLE_STUDENT'));
    expect(isAdTrackingAllowed(input)).toBe(false);

    syncExcludedBrowser(anon);
    expect(isAdTrackingAllowed(input)).toBe(false);

    syncExcludedBrowser(member('ROLE_TEACHER'));
    expect(isAdTrackingAllowed(input)).toBe(true);
  });
});

describe('나이 경계', () => {
  const now = new Date('2026-11-06T12:00:00');

  it('만 14세 생일 전날까지 14세 미만이다', () => {
    expect(isUnder14ByBirthDate('2012-11-07', now)).toBe(true);
    expect(isUnder14ByBirthDate('2012-11-06', now)).toBe(false);
    expect(isUnder14ByBirthDate('2010-01-01', now)).toBe(false);
  });

  it('값이 없거나 깨졌으면 확인 불가다', () => {
    expect(isUnder14ByBirthDate('', now)).toBe(false);
    expect(isUnder14ByBirthDate(null, now)).toBe(false);
    expect(isUnder14ByBirthDate('모름', now)).toBe(false);
  });

  it('출생연도만 있으면 생일 전일 수 있는 해까지 포함한다', () => {
    expect(mayBeUnder14ByBirthYear(2013, now)).toBe(true);
    expect(mayBeUnder14ByBirthYear(2012, now)).toBe(true);
    expect(mayBeUnder14ByBirthYear(2011, now)).toBe(false);
    expect(mayBeUnder14ByBirthYear(undefined, now)).toBe(false);
  });
});

describe('Meta 기본 코드', () => {
  it('자동 PageView 와 자동 수집을 init 전에 끈다', () => {
    const script = metaPixelInitScript('1');
    const init = script.indexOf('fbq("init"');

    expect(script.indexOf('fbq.disablePushState=true')).toBeLessThan(init);
    expect(script.indexOf('fbq("set","autoConfig",false,"1")')).toBeLessThan(
      init
    );
    expect(script.indexOf('fbq.disablePushState=true')).toBeGreaterThan(-1);
    expect(script.indexOf('fbq.allowDuplicatePageViews=true')).toBeLessThan(
      init
    );
    expect(script.indexOf('fbq.allowDuplicatePageViews=true')).toBeGreaterThan(
      -1
    );
  });
});
