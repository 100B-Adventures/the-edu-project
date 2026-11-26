import { describe, expect, it } from 'vitest';

import { SHELL_CAPABILITIES } from './shell-capabilities';

describe('MVP-H 조각 3 능력 계약', () => {
  it('T-S3-CAP-1 완성된 조각 3 진입점만 공개한다', () => {
    expect(SHELL_CAPABILITIES).toMatchObject({
      program: true,
      levelTest: false,
      ebookLibrary: true,
      bestNotes: true,
      declarations: true,
    });
  });

  it('T-S3-CAP-2 실제 후기 저장소가 없으므로 homeReviews는 닫아 둔다', () => {
    expect(SHELL_CAPABILITIES.homeReviews).toBe(false);
  });

  it('T-S3-CAP-3 S04~S07 토큰·문제·미디어 계약을 끝내기 전 레벨 테스트를 닫아 둔다', () => {
    expect(SHELL_CAPABILITIES.levelTest).toBe(false);
  });
});
