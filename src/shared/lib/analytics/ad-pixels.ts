/*
 * 광고 전환 픽셀 (2026-11-05, 회장 2026-10-27 승인). ID 는 페이지 소스에 그대로 나가는 공개값이다.
 * 운영(hongong.today) 빌드에서만 켠다. GA4·Clarity 와 같은 기준이다.
 * 형식 근거: Meta 표준 기본 코드, 당근 웹사이트 연동 가이드
 * (https://businessdaangn.gitbook.io/business.daangn/ads-pro/tools/tracking/website.md).
 */
export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID || '1687264329671537';
export const KARROT_PIXEL_ID =
  process.env.NEXT_PUBLIC_KARROT_PIXEL_ID || '1793082397549324001';

export const shouldLoadAdPixels = (appEnv: string | undefined) =>
  appEnv === 'production';

export const metaPixelInitScript = (id: string = META_PIXEL_ID) =>
  [
    '!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");',
    `fbq("init",${JSON.stringify(id)});`,
    'fbq("track","PageView");',
  ].join('');

export const karrotPixelInitScript = (id: string = KARROT_PIXEL_ID) =>
  [
    '(function(w,d){if(w.karrotPixel)return;var k={stub:true,queue:[]};k.init=function(){k.queue.push(["init",arguments,Date.now()])};k.track=function(){k.queue.push(["track",arguments,Date.now()])};w.karrotPixel=k;var s=d.createElement("script");s.async=true;s.src="https://karrot-pixel.business.daangn.com/karrot-pixel.js";var f=d.getElementsByTagName("script")[0];f&&f.parentNode?f.parentNode.insertBefore(s,f):d.head.appendChild(s)})(window,document);',
    `window.karrotPixel.init(${JSON.stringify(id)});`,
    'window.karrotPixel.track("ViewPage");',
  ].join('');
