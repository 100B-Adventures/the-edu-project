import { afterEach, describe, expect, it, vi } from 'vitest';

import { isMvpHSliceEnabled } from './mvp-h-slice';

const setEnv = (flag: string | undefined, appEnv: string | undefined) => {
  vi.stubEnv('NEXT_PUBLIC_MVPH_SLICE1', flag as string);
  vi.stubEnv('NEXT_PUBLIC_APP_ENV', appEnv as string);
  if (flag === undefined) delete process.env.NEXT_PUBLIC_MVPH_SLICE1;
  if (appEnv === undefined) delete process.env.NEXT_PUBLIC_APP_ENV;
};

describe('isMvpHSliceEnabled 스위치 규칙', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('F1 값이 on 이면 환경과 상관없이 켜진다', () => {
    setEnv('on', 'production');
    expect(isMvpHSliceEnabled()).toBe(true);
  });

  it('F2 값이 off 이면 dev 여도 꺼진다', () => {
    setEnv('off', 'dev');
    expect(isMvpHSliceEnabled()).toBe(false);
  });

  it('F3 값이 없고 APP_ENV 가 dev 이면 켜진다(스테이징)', () => {
    setEnv(undefined, 'dev');
    expect(isMvpHSliceEnabled()).toBe(true);
  });

  it('F4 값이 없고 APP_ENV 가 preview 이면 켜진다', () => {
    setEnv(undefined, 'preview');
    expect(isMvpHSliceEnabled()).toBe(true);
  });

  it('F5 값이 없고 APP_ENV 가 production 이면 꺼진다(운영 불변)', () => {
    setEnv(undefined, 'production');
    expect(isMvpHSliceEnabled()).toBe(false);
  });

  it('F6 값이 없고 APP_ENV 가 local 이거나 비어 있으면 꺼진다', () => {
    setEnv(undefined, 'local');
    expect(isMvpHSliceEnabled()).toBe(false);
    setEnv(undefined, undefined);
    expect(isMvpHSliceEnabled()).toBe(false);
  });
});
