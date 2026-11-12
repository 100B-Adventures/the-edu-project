import { describe, expect, it } from 'vitest';

import { shouldLoadAdPixels } from './ad-pixels';
import { isProductionAnalyticsHost } from './production-host';

describe('운영 호스트 판정', () => {
  it.each(['hongong.today', 'www.hongong.today', 'HongOng.Today'])(
    '%s 는 운영 호스트다',
    (host) => {
      expect(isProductionAnalyticsHost(host)).toBe(true);
    }
  );

  it.each([
    'localhost',
    '127.0.0.1',
    'stage.hongong.today',
    'hongong.today.evil.example',
    '',
    undefined,
    null,
  ])('%s 는 운영 호스트가 아니다', (host) => {
    expect(isProductionAnalyticsHost(host)).toBe(false);
  });

  it('광고 픽셀은 production 빌드이면서 운영 호스트일 때만 로드한다', () => {
    expect(shouldLoadAdPixels('production', 'hongong.today')).toBe(true);
    expect(shouldLoadAdPixels('production', 'localhost')).toBe(false);
    expect(shouldLoadAdPixels('production', '127.0.0.1')).toBe(false);
    expect(shouldLoadAdPixels('dev', 'hongong.today')).toBe(false);
    expect(shouldLoadAdPixels(undefined, 'hongong.today')).toBe(false);
  });
});
