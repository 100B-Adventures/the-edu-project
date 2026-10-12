import Script from 'next/script';

import {
  GA4_MEASUREMENT_ID,
  ga4InitScript,
  ga4ScriptSrc,
  shouldLoadGa4,
} from '@/shared/lib/analytics/ga4';

/** GA4 태그. 운영 빌드에서만 그린다. 광고 개인화·Google signals 끔. */
export const Ga4Script = () => {
  if (!shouldLoadGa4(process.env.NEXT_PUBLIC_APP_ENV, GA4_MEASUREMENT_ID)) {
    return null;
  }

  return (
    <>
      <Script id="ga4-src" src={ga4ScriptSrc()} strategy="afterInteractive" />
      <Script
        id="ga4-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: ga4InitScript() }}
      />
    </>
  );
};
