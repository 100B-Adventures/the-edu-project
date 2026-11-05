import { isAdBlockedUrl, isAdEligibleSignUpRole } from './ad-pixels';

/*
 * 광고 전환 이벤트 한 곳. Meta 픽셀·당근 픽셀·GA4 로 같은 전환을 보낸다.
 * 개인정보(이메일·전화·이름·생년)는 어떤 매체에도 넘기지 않는다.
 * Purchase 는 없다: 실결제 승인은 PG 미정이라 스텁이고 주문 생성까지만 있다(course-tier-section.tsx).
 * 결제 승인이 생기면 서버 확정 금액으로 여기에 추가한다.
 */
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    karrotPixel?: { track: (event: string, params?: object) => void };
  }
}

const ONCE_PREFIX = 'conv:';

// 같은 전환을 두 번 세지 않는다. 저장소가 막힌 브라우저에서는 그대로 보낸다.
const firstTime = (key: string) => {
  try {
    const storageKey = `${ONCE_PREFIX}${key}`;
    if (window.sessionStorage.getItem(storageKey)) return false;
    window.sessionStorage.setItem(storageKey, '1');
  } catch {}
  return true;
};

const safely = (send: () => void) => {
  try {
    send();
  } catch {}
};

const onAdBlockedUrl = () =>
  isAdBlockedUrl(window.location.pathname, window.location.search);

/**
 * 학생 가입과 초대 링크 가입은 Meta·당근으로 보내지 않는다. GA4 는 이번 범위 밖이라 그대로 둔다.
 * role 을 모르면 보내지 않는다.
 */
export const trackSignUpConversion = (
  method: 'email' | 'kakao' | 'invite',
  role?: string | null
) => {
  if (typeof window === 'undefined' || !firstTime(`signup:${method}`)) return;
  if (
    method !== 'invite' &&
    isAdEligibleSignUpRole(role) &&
    !onAdBlockedUrl()
  ) {
    safely(() => window.fbq?.('track', 'CompleteRegistration'));
    safely(() => window.karrotPixel?.track('CompleteRegistration'));
  }
  safely(() => window.gtag?.('event', 'sign_up', { method }));
};

export const trackLeadConversion = (
  source: 'consult' | 'inquiry',
  uniqueId: string | number,
  { adsAllowed = true }: { adsAllowed?: boolean } = {}
) => {
  if (typeof window === 'undefined') return;
  if (!firstTime(`lead:${source}:${uniqueId}`)) return;
  if (adsAllowed && !onAdBlockedUrl()) {
    safely(() => window.fbq?.('track', 'Lead'));
    safely(() => window.karrotPixel?.track('Lead'));
  }
  safely(() => window.gtag?.('event', 'generate_lead', { source }));
};
