import { describe, expect, it } from 'vitest';

import {
  GA4_MEASUREMENT_ID,
  ga4InitScript,
  ga4ScriptSrc,
  shouldLoadGa4,
} from './ga4';

describe('ga4', () => {
  it('측정 ID 는 속성 516671158 의 웹 스트림 ID 다', () => {
    expect(GA4_MEASUREMENT_ID).toBe('G-F546M8Z4HH');
  });

  it('gtag/js 주소에 id 쿼리가 붙는다', () => {
    expect(ga4ScriptSrc('G-TEST123')).toBe(
      'https://www.googletagmanager.com/gtag/js?id=G-TEST123'
    );
  });

  it('초기화 스크립트는 광고 개인화와 Google signals 를 끈다', () => {
    const script = ga4InitScript('G-TEST123');
    expect(script).toContain('gtag(\'config\',"G-TEST123"');
    expect(script).toContain('allow_google_signals:false');
    expect(script).toContain('allow_ad_personalization_signals:false');
  });

  it('운영 환경에서만 켠다', () => {
    expect(shouldLoadGa4('production', 'G-X')).toBe(true);
    expect(shouldLoadGa4('dev', 'G-X')).toBe(false);
    expect(shouldLoadGa4('preview', 'G-X')).toBe(false);
    expect(shouldLoadGa4('local', 'G-X')).toBe(false);
    expect(shouldLoadGa4(undefined, 'G-X')).toBe(false);
    expect(shouldLoadGa4('production', '')).toBe(false);
  });
});
