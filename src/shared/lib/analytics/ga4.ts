/*
 * GA4 직접 태그 (관제 마케팅 수집기가 속성 516671158 을 읽는다, 2026-10-12).
 * 측정 ID 는 공개값(페이지 소스에 노출)이라 코드에 두고 NEXT_PUBLIC_GA4_ID 로 덮어쓸 수 있다.
 * 운영(hongong.today) 빌드에서만 켠다 — dev·preview·local 방문이 속성에 섞이지 않게 한다.
 * 광고 개인화·Google signals 는 끈다.
 */
export const GA4_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA4_ID ?? 'G-F546M8Z4HH';

export const ga4ScriptSrc = (id: string = GA4_MEASUREMENT_ID) =>
  `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;

export const ga4InitScript = (id: string = GA4_MEASUREMENT_ID) =>
  [
    'window.dataLayer=window.dataLayer||[];',
    'function gtag(){dataLayer.push(arguments);}',
    "gtag('js',new Date());",
    `gtag('config',${JSON.stringify(id)},{allow_google_signals:false,allow_ad_personalization_signals:false});`,
  ].join('');

export const shouldLoadGa4 = (appEnv: string | undefined, id: string) =>
  appEnv === 'production' && id.length > 0;
