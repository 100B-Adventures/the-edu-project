import { Suspense } from 'react';

import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import Script from 'next/script';

import { AdPixelsScript } from '@/app/_components/ad-pixels-script';
import { DesktopSiteNotice } from '@/app/_components/desktop-site-notice';
import { Ga4Script } from '@/app/_components/ga4-script';
import { PwaRegister } from '@/app/_components/pwa-register';
import { StaleVersionReload } from '@/app/_components/stale-version-reload';
import { WhatsNewCard } from '@/app/_components/whats-new-card';
import { SITE_CONFIG } from '@/config/site';
import { GlobalRoleNavigationShell } from '@/features/dashboard/components/global-role-navigation-shell';
import { Header } from '@/layout/header';
import { GlobalProvider } from '@/providers';
import '@/shared/components/editor/styles/text-editor.css';
import {
  ANALYTICS_BLOCKED_FLAG,
  tokenUrlGuardScript,
} from '@/shared/lib/analytics/token-url-guard';
import { APP_VERSION_IDENTITY } from '@/shared/lib/app-version';
import { STALE_ASSET_GUARD } from '@/shared/lib/stale-asset-guard';
import '@/styles/globals.css';
import 'katex/dist/katex.min.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  // 2026-10-09 도메인 이전(hongong.today) 후속: 옛 브랜드명 THE EDU가 제목이 없는
  // 화면(로그인 등)의 브라우저 탭에 그대로 노출되던 것을 정정. 서비스 이름 오독공(회장 2026-10-10 확정, 동일 상표 0건).
  title: '오독공',
  description:
    '오독공(오늘 독한 혼공)은 중고등 수학 학생이 AI 코치와 함께 스스로 풀고, 선생님이 그 과정을 확인하고 피드백하는 과외 플랫폼입니다.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '오독공',
  },
  icons: {
    apple: '/icons/apple-touch-icon-180.png',
  },
  verification: {
    // Search Console URL 접두어 속성 https://hongong.today/ 소유 확인(2026-11-03). 지우면 확인이 풀린다.
    google: [
      process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
      'shS3EGG6rnVs3_FgI-a2qeehdlsyqn2mOD_1Ojxy1yc',
      '69VG23UnnyYvrV8yuqRhCF9Ajp_-vdR2gibjoYbO8fI',
    ].filter((value): value is string => Boolean(value)),
    other: {
      'naver-site-verification':
        process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION ?? '',
    },
  },
  other: {
    'app-version': APP_VERSION_IDENTITY,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#FF4805',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

  const shouldLoadGtm =
    Boolean(gtmId) && process.env.NEXT_PUBLIC_ENABLE_GTM === 'true';

  // Microsoft Clarity(세션 녹화·히트맵, 2026-11-03). 운영 빌드에서만 켠다. ID 는 공개값.
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || 'z7rli8ee4r';
  const shouldLoadClarity = process.env.NEXT_PUBLIC_APP_ENV === 'production';

  return (
    <html
      lang="ko"
      className={`${pretendard.variable} font-app`}
      suppressHydrationWarning
    >
      <head>
        {/* 화면 스크립트보다 먼저 도는 자가 복구. 옛 빌드 HTML 이 어디서든(캐시·복원) 뜨면 그
         * HTML 이 가리키는 /_next/static 파일이 404 가 나 화면 스크립트가 못 켜진다. 그때 한 번만
         * 새로고침해 최신 HTML 을 받는다. 1분 안 재발은 무시해 반복 새로고침을 막는다(2026-10-02). */}
        <script
          dangerouslySetInnerHTML={{
            __html: STALE_ASSET_GUARD,
          }}
        />
        {/* 토큰 주소 판정. 분석 스크립트보다 먼저 돌아야 해서 인라인이다. */}
        <script dangerouslySetInnerHTML={{ __html: tokenUrlGuardScript() }} />
        {shouldLoadClarity && (
          <Script
            id="clarity-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `if(!window.${ANALYTICS_BLOCKED_FLAG})(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${clarityId}");`,
            }}
          />
        )}
      </head>
      <body className="bg-gray-1 antialiased">
        {/* 승인 디자인의 앱 글꼴. CDN이 실패하면 로컬 Pretendard로 즉시 폴백한다. */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/wanteddev/wanted-sans@v1.0.3/packages/wanted-sans/fonts/webfonts/variable/split/WantedSansVariable.min.css"
        />
        <DesktopSiteNotice />
        {/* GTM Head 스니펫 */}
        {/* 배포환경일때만 작동되게 */}
        {shouldLoadGtm && (
          <>
            <Script
              id="gtm-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                `,
              }}
            />
            <Script
              id="gtm-script"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  if(!window.${ANALYTICS_BLOCKED_FLAG})(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                  })(window,document,'script','dataLayer','${gtmId}');
                `,
              }}
            />
          </>
        )}
        {/* GTM Body 스니펫 (noscript) */}
        {shouldLoadGtm && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
        <GlobalProvider>
          <Suspense fallback={null}>
            <AdPixelsScript />
          </Suspense>
          <Header />
          <GlobalRoleNavigationShell>{children}</GlobalRoleNavigationShell>
        </GlobalProvider>
        <PwaRegister />
        <Ga4Script />
        <StaleVersionReload />
        <Suspense fallback={null}>
          <WhatsNewCard />
        </Suspense>
      </body>
    </html>
  );
}

const pretendard = localFont({
  src: [
    {
      path: '../assets/fonts/Pretendard-Regular.subset.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../assets/fonts/Pretendard-Medium.subset.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../assets/fonts/Pretendard-SemiBold.subset.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../assets/fonts/Pretendard-Bold.subset.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../assets/fonts/Pretendard-ExtraBold.subset.woff2',
      weight: '800',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-pretendard',
});
