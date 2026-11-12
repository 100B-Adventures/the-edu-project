/*
 * 분석·광고 스크립트를 로드하거나 전송해도 되는 운영 호스트 (2026-11-13).
 * 빌드 env(NEXT_PUBLIC_APP_ENV)만 보면 로컬·QA 에서 production 으로 실행할 때 운영 측정 ID 로 전송된다.
 * 운영 GA4 에 localhost 이벤트가 14일간 340건 섞인 것이 그 결과다. 실행 때 hostname 을 한 번 더 본다.
 */
export const PRODUCTION_ANALYTICS_HOSTS = [
  'hongong.today',
  'www.hongong.today',
] as const;

export const isProductionAnalyticsHost = (
  hostname: string | null | undefined
): boolean =>
  typeof hostname === 'string' &&
  (PRODUCTION_ANALYTICS_HOSTS as readonly string[]).includes(
    hostname.toLowerCase()
  );
