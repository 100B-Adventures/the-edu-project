import { trackAmplitudeEvent } from './amplitude';
import { pushToDataLayer } from './gtm';

/*
 * GA4 전송 (2026-11-12 수정).
 * 운영은 GTM 컨테이너 없이 gtag.js 를 직접 싣는다(ga4.ts). gtag.js 는 dataLayer.push({event}) 객체를
 * GA4 이벤트로 보내지 않고 gtag('event', ...) 호출만 보낸다. 그래서 종전에는 맞춤 이벤트가 GA4 에 0건이었다.
 * GA4 키 이벤트로 선언된 이름(signup_success·login_success)과 코드 이름(auth_*)이 달라 GA4 쪽 이름으로 바꿔 보낸다.
 * dataLayer·Amplitude 이름은 그대로 둔다(기존 대시보드 유지).
 */
export const GA4_EVENT_ALIASES: Record<string, string> = {
  auth_signup_success: 'signup_success',
  auth_login_success: 'login_success',
};

export const ga4EventName = (event: string): string =>
  GA4_EVENT_ALIASES[event] ?? event;

type GtagFn = (command: 'event', name: string, params?: Record<string, unknown>) => void;

export const sendGa4Event = (
  event: string,
  params?: Record<string, unknown>
): void => {
  if (typeof window === 'undefined') return;
  const gtag = (window as unknown as { gtag?: GtagFn }).gtag;
  if (typeof gtag !== 'function') return;
  gtag('event', ga4EventName(event), params);
};

export const track = (
  event: string,
  params?: Record<string, unknown>
): void => {
  try {
    pushToDataLayer(event, params);
  } catch {}
  try {
    sendGa4Event(event, params);
  } catch {}
  try {
    trackAmplitudeEvent(event, params);
  } catch {}
};
