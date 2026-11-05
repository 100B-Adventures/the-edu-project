import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { trackLeadConversion, trackSignUpConversion } from './conversions';

describe('광고 전환 이벤트', () => {
  const fbq = vi.fn();
  const gtag = vi.fn();
  const track = vi.fn();

  beforeEach(() => {
    window.sessionStorage.clear();
    vi.clearAllMocks();
    window.fbq = fbq;
    window.gtag = gtag;
    window.karrotPixel = { track };
  });

  afterEach(() => {
    delete window.fbq;
    delete window.gtag;
    delete window.karrotPixel;
  });

  it('가입 완료를 세 매체로 한 번만 보낸다', () => {
    trackSignUpConversion('email');
    trackSignUpConversion('email');

    expect(fbq).toHaveBeenCalledTimes(1);
    expect(fbq).toHaveBeenCalledWith('track', 'CompleteRegistration');
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith('CompleteRegistration');
    expect(gtag).toHaveBeenCalledWith('event', 'sign_up', { method: 'email' });
  });

  it('리드는 접수번호별로 한 번만 보내고 다른 접수번호는 다시 보낸다', () => {
    trackLeadConversion('consult', 'A1');
    trackLeadConversion('consult', 'A1');
    trackLeadConversion('consult', 'A2');

    expect(fbq).toHaveBeenCalledTimes(2);
    expect(track).toHaveBeenCalledWith('Lead');
    expect(gtag).toHaveBeenCalledWith('event', 'generate_lead', {
      source: 'consult',
    });
  });

  it('픽셀이 없어도 화면 흐름을 깨지 않는다', () => {
    delete window.fbq;
    delete window.karrotPixel;
    delete window.gtag;

    expect(() => trackSignUpConversion('kakao')).not.toThrow();
  });
});
