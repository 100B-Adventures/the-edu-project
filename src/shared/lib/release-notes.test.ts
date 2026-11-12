import { describe, expect, it } from 'vitest';

import {
  CURRENT_PUBLIC_RELEASE_NOTE,
  PUBLIC_RELEASE_NOTES,
} from './release-notes';

describe('공개 업데이트 기록 생성 계약', () => {
  it('REL-UNIT-001 정상: 최신 3개 운영 버전을 RELEASE.md 순서대로 제공한다', () => {
    expect(PUBLIC_RELEASE_NOTES.map(({ version }) => version)).toEqual([
      'v2.0.22',
      'v2.0.21',
      'v2.0.20',
    ]);
  });

  it('REL-UNIT-002 거절: 버그 수정 버전은 새로운 기능 알림 대상이 아니다', () => {
    expect(PUBLIC_RELEASE_NOTES.slice(1).every(({ notify }) => !notify)).toBe(
      true
    );
    expect(CURRENT_PUBLIC_RELEASE_NOTE?.notify).toBe(true);
  });
});
