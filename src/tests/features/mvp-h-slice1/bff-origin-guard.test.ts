import {
  isChargingRequest,
  isForeignOrigin,
} from '@/shared/lib/bff/origin-guard';
import { describe, expect, it } from 'vitest';

const h = (init: Record<string, string>) => new Headers(init);

describe('시험 항목 S33 포인트가 나가는 BFF 요청은 다른 사이트 출처를 막는다 (교차 리뷰 P1-2)', () => {
  it('S33-1 해설 열람 POST 만 검사 대상이다', () => {
    expect(
      isChargingRequest('POST', [
        'student',
        'solution-notes',
        '3',
        'explanation',
      ])
    ).toBe(true);
    expect(
      isChargingRequest('GET', [
        'student',
        'solution-notes',
        '3',
        'explanation',
      ])
    ).toBe(false);
    expect(isChargingRequest('POST', ['student', 'solution-notes'])).toBe(
      false
    );
  });

  it('S33-2 같은 사이트 Origin 은 통과, 다른 사이트 Origin 은 거절', () => {
    const host = 'dev.d-edu.site';
    expect(
      isForeignOrigin(h({ origin: 'https://dev.d-edu.site', host }), host)
    ).toBe(false);
    expect(
      isForeignOrigin(h({ origin: 'https://evil.example', host }), host)
    ).toBe(true);
  });

  it('S33-3 Origin 이 없으면(서버 간 호출) 통과, 프록시 뒤에서는 x-forwarded-host 도 본다', () => {
    expect(isForeignOrigin(h({}), 'localhost:3000')).toBe(false);
    expect(
      isForeignOrigin(
        h({
          origin: 'https://dev.d-edu.site',
          'x-forwarded-host': 'dev.d-edu.site',
        }),
        'internal:3000'
      )
    ).toBe(false);
    expect(isForeignOrigin(h({ origin: 'not a url' }), 'x')).toBe(true);
  });
});
