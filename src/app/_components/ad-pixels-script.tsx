import Script from 'next/script';

import {
  karrotPixelInitScript,
  metaPixelInitScript,
  shouldLoadAdPixels,
} from '@/shared/lib/analytics/ad-pixels';

/** Meta·당근 기본 코드. 운영 빌드에서만 그린다. */
export const AdPixelsScript = () => {
  if (!shouldLoadAdPixels(process.env.NEXT_PUBLIC_APP_ENV)) return null;

  return (
    <>
      <Script
        id="meta-pixel-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: metaPixelInitScript() }}
      />
      <Script
        id="karrot-pixel-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: karrotPixelInitScript() }}
      />
    </>
  );
};
