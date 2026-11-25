/**
 * 포인트가 나가는 BFF 요청의 출처 검사(교차 리뷰 P1-2).
 * 백엔드는 CSRF 필터가 꺼져 있고 쿠키가 SameSite=None 이라, 다른 사이트의 폼·스크립트가 사용자의 쿠키를 실어
 * 이 BFF 로 요청을 보낼 수 있다. 브라우저는 교차 출처 POST 에 Origin 을 붙이므로, Origin 이 있고 이 사이트가
 * 아니면 막는다. Origin 이 없는 요청(서버 간 호출, 도구)은 쿠키를 싣고 오는 브라우저 요청이 아니므로 통과한다.
 *
 * 검사 대상은 돈이 나가는 경로로 한정한다: 프록시가 host 를 바꾸는 환경에서 모든 POST 가 막히는 사고를 피하기 위해서다.
 */
const CHARGING_PATHS: RegExp[] = [
  /^student\/solution-notes\/\d+\/explanation$/,
];

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const isChargingRequest = (method: string, pathSegments: string[]) =>
  MUTATING.has(method.toUpperCase()) &&
  CHARGING_PATHS.some((pattern) => pattern.test(pathSegments.join('/')));

/** 이 요청이 다른 사이트에서 온 것으로 보이면 true. 사이트 host 후보(host, x-forwarded-host, 요청 URL) 어디와도 다를 때만. */
export const isForeignOrigin = (headers: Headers, requestHost: string) => {
  const origin = headers.get('origin');
  if (!origin) return false;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return true;
  }
  const hosts = [
    headers.get('x-forwarded-host'),
    headers.get('host'),
    requestHost,
  ].filter((value): value is string => !!value);
  return !hosts.some((host) => host.split(',')[0]?.trim() === originHost);
};
