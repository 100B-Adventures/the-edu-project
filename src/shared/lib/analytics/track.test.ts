import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./amplitude', () => ({ trackAmplitudeEvent: vi.fn() }));
vi.mock('./gtm', () => ({ pushToDataLayer: vi.fn() }));

import { ga4EventName, sendGa4Event, track } from './track';

type W = { gtag?: unknown };

afterEach(() => {
  delete (window as unknown as W).gtag;
});

describe('GA4 전송', () => {
  it('키 이벤트 이름을 GA4 선언 이름으로 바꾼다', () => {
    expect(ga4EventName('auth_signup_success')).toBe('signup_success');
    expect(ga4EventName('auth_login_success')).toBe('login_success');
    expect(ga4EventName('studyroom_create_success')).toBe('studyroom_create_success');
  });

  it('gtag 가 있으면 gtag("event") 로 보낸다', () => {
    const gtag = vi.fn();
    (window as unknown as W).gtag = gtag;
    track('auth_signup_success', { method: 'email' });
    expect(gtag).toHaveBeenCalledWith('event', 'signup_success', { method: 'email' });
  });

  it('gtag 가 없으면(차단 주소·비운영) 조용히 넘어간다', () => {
    expect(() => sendGa4Event('auth_login_success')).not.toThrow();
  });
});
