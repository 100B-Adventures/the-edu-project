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

/*
 * 픽셀을 켜지 않는 자리 (2026-11-06, 회장 "니가할거 다 하고 진행하라고").
 * 근거: 개인정보위 2024-01 맞춤형 광고 정책 방안 보도. 14세 미만임을 알거나 아동이 주 이용자인
 * 서비스에서 맞춤형 광고 목적 행태정보를 수집하지 않도록 권고한다. 법률 판단이 아니라 보수적 운영 기준이다.
 *
 * 학생의 나이는 가입 때 받지 않아(birth_date 미수집, 학년은 고1 이상 진단값뿐) 14세 미만을 가려낼 수 없다.
 * 그래서 학생 역할 전체를 뺀다. 판정은 허용 목록이다. 모르면 켜지 않는다.
 */
const STUDENT_PATHS = [
  '/dashboard/student',
  '/learning',
  '/tree',
  '/points',
  '/friends',
  '/onboarding',
  '/study-note',
  '/profile/student',
  '/open-challenge',
];
const NON_LANDING_PATHS = ['/login', '/admin'];
// 경로 자체에 초대 토큰이 들어가는 자리. Meta·당근은 페이지 주소를 그대로 받는다.
const TOKEN_PATHS = ['/invite', '/friends/challenge'];
const TOKEN_QUERY = /token|invite|code|secret/i;
const COURSE_LEARN_PATH = /^\/courses\/[^/]+\/learn(\/|$)/;
const AD_ELIGIBLE_ROLES = new Set([
  'ROLE_TEACHER',
  'ROLE_PARENT',
  'ROLE_MEMBER',
]);
const AD_ELIGIBLE_SIGNUP_ROLES = new Set(['ROLE_TEACHER', 'ROLE_PARENT']);
const EXCLUDED_BROWSER_KEY = 'ad-pixels:excluded-browser';

const underPath = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(`${base}/`);

/** 주소에 초대·인증 토큰이 실릴 수 있으면 true. 이전 페이지 주소(referrer) 판정에도 쓴다. */
export const isTokenBearingUrl = (pathname: string, search: string) =>
  TOKEN_PATHS.some((base) => underPath(pathname, base)) ||
  Array.from(new URLSearchParams(search).keys()).some((key) =>
    TOKEN_QUERY.test(key)
  );

export const isAdBlockedUrl = (pathname: string, search: string) =>
  STUDENT_PATHS.some((base) => underPath(pathname, base)) ||
  NON_LANDING_PATHS.some((base) => underPath(pathname, base)) ||
  COURSE_LEARN_PATH.test(pathname) ||
  isTokenBearingUrl(pathname, search);

/** 생년월일 기준 만 14세 미만이면 true. 값이 없거나 깨졌으면 확인 불가라 false. */
export const isUnder14ByBirthDate = (
  birthDate: string | null | undefined,
  now: Date = new Date()
) => {
  if (!birthDate) return false;
  const born = new Date(birthDate);
  if (Number.isNaN(born.getTime())) return false;
  const turns14 = new Date(born);
  turns14.setFullYear(born.getFullYear() + 14);
  return now < turns14;
};

/** 출생연도만 있을 때. 생일 전이면 만 13세일 수 있는 해까지 14세 미만으로 본다. */
export const mayBeUnder14ByBirthYear = (
  birthYear: number | null | undefined,
  now: Date = new Date()
) => {
  if (!birthYear || Number.isNaN(birthYear)) return false;
  return now.getFullYear() - birthYear <= 14;
};

export const isAdEligibleSignUpRole = (role: string | null | undefined) =>
  Boolean(role && AD_ELIGIBLE_SIGNUP_ROLES.has(role));

export type AdSessionInput = {
  status: 'loading' | 'authenticated' | 'unauthenticated' | 'error';
  role?: string | null;
  birthDate?: string | null;
};

const isExcludedMember = ({ role, birthDate }: AdSessionInput) =>
  !role || !AD_ELIGIBLE_ROLES.has(role) || isUnder14ByBirthDate(birthDate);

const readExcludedBrowser = () => {
  try {
    return window.localStorage.getItem(EXCLUDED_BROWSER_KEY) === '1';
  } catch {
    return false;
  }
};

/*
 * 세션이 끝난 학생이 공개 화면으로 돌아와도 다시 잡히지 않게 브라우저에 표시를 남긴다.
 * 선생님·학부모가 로그인하면 지운다.
 */
export const syncExcludedBrowser = (session: AdSessionInput) => {
  if (session.status !== 'authenticated') return;
  try {
    if (isExcludedMember(session)) {
      window.localStorage.setItem(EXCLUDED_BROWSER_KEY, '1');
    } else {
      window.localStorage.removeItem(EXCLUDED_BROWSER_KEY);
    }
  } catch {}
};

/** 픽셀을 켜도 되면 true. session.status 가 loading 이면 판정 전이므로 호출하지 않는다. */
export const isAdTrackingAllowed = ({
  pathname,
  search,
  referrer,
  origin,
  session,
  excludedBrowser = readExcludedBrowser(),
}: {
  pathname: string;
  search: string;
  referrer: string;
  origin: string;
  session: AdSessionInput;
  excludedBrowser?: boolean;
}) => {
  if (isAdBlockedUrl(pathname, search)) return false;
  // 직전 페이지가 토큰 주소면 픽셀이 referrer 로 그 주소를 받는다.
  if (referrer) {
    try {
      const previous = new URL(referrer);
      if (
        previous.origin === origin &&
        isTokenBearingUrl(previous.pathname, previous.search)
      ) {
        return false;
      }
    } catch {}
  }
  if (session.status === 'authenticated') return !isExcludedMember(session);
  return session.status === 'unauthenticated' && !excludedBrowser;
};

export const metaPixelInitScript = (id: string = META_PIXEL_ID) =>
  [
    '!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");',
    // SPA 이동마다 자동 PageView 를 보내면 제외 경로 주소가 먼저 나간다. 이동 PageView 는 AdPixelsScript 가 판정 뒤에 보낸다.
    // 자동 추적을 끄면 Meta 가 주소 변경을 몰라 같은 페이지 중복으로 보고 PageView 를 버린다(2026-11-06 실측).
    'fbq.disablePushState=true;fbq.allowDuplicatePageViews=true;',
    // 버튼 문구 자동 수집(SubscribedButtonClick)을 끈다. 선생님 화면 버튼에는 학생 이름이 들어갈 수 있다.
    `fbq("set","autoConfig",false,${JSON.stringify(id)});`,
    `fbq("init",${JSON.stringify(id)});`,
    'fbq("track","PageView");',
  ].join('');

export const karrotPixelInitScript = (id: string = KARROT_PIXEL_ID) =>
  [
    '(function(w,d){if(w.karrotPixel)return;var k={stub:true,queue:[]};k.init=function(){k.queue.push(["init",arguments,Date.now()])};k.track=function(){k.queue.push(["track",arguments,Date.now()])};w.karrotPixel=k;var s=d.createElement("script");s.async=true;s.src="https://karrot-pixel.business.daangn.com/karrot-pixel.js";var f=d.getElementsByTagName("script")[0];f&&f.parentNode?f.parentNode.insertBefore(s,f):d.head.appendChild(s)})(window,document);',
    `window.karrotPixel.init(${JSON.stringify(id)});`,
    'window.karrotPixel.track("ViewPage");',
  ].join('');
