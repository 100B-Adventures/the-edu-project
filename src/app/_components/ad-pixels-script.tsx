'use client';

import { useEffect, useRef, useState } from 'react';

import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';

import { useSession } from '@/providers/session/session-context';
import {
  isAdTrackingAllowed,
  karrotPixelInitScript,
  metaPixelInitScript,
  shouldLoadAdPixels,
  syncExcludedBrowser,
} from '@/shared/lib/analytics/ad-pixels';

/**
 * Meta·당근 기본 코드. 운영 빌드에서 경로와 세션을 판정한 뒤에만 그린다.
 * 한번 켠 뒤 제외 대상으로 넘어가면 다시 읽어 메모리의 픽셀을 비운다. 픽셀 스크립트가 클릭과
 * 주소 변경을 직접 듣기 때문에(당근 pushState 후킹, Meta 자동 이벤트) 안 보내는 것으로는 보장이 안 된다.
 * 새 문서에서는 픽셀이 없으니 반복되지 않는다.
 */
export const AdPixelsScript = () => {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const { status, member } = useSession();
  const [loaded, setLoaded] = useState(false);
  const lastUrl = useRef<string | null>(null);
  const role = member?.role;
  const birthDate = member?.birthDate;

  useEffect(() => {
    if (!shouldLoadAdPixels(process.env.NEXT_PUBLIC_APP_ENV)) return;
    if (status === 'loading') return;

    const session = { status, role, birthDate };
    syncExcludedBrowser(session);

    const allowed = isAdTrackingAllowed({
      pathname,
      search,
      referrer: document.referrer,
      origin: window.location.origin,
      session,
    });
    if (!allowed) {
      // location.href 가 아니라 라우터 주소로 간다. 토큰 주소는 pushState 가 가로채여 location.href 가 아직
      // 이전 페이지라, location.href 로 다시 읽으면 가던 길이 취소되고 이전 페이지로 돌아간다.
      if (loaded) {
        window.location.replace(
          `${pathname}${search ? `?${search}` : ''}${window.location.hash}`
        );
      }
      return;
    }

    const url = `${pathname}?${search}`;
    if (!loaded) {
      lastUrl.current = url;
      setLoaded(true);
      return;
    }
    if (lastUrl.current !== url) {
      lastUrl.current = url;
      window.fbq?.('track', 'PageView');
    }
  }, [pathname, search, status, role, birthDate, loaded]);

  if (!loaded) return null;

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
