import { TOKEN_PATHS, TOKEN_QUERY } from './ad-pixels';

/*
 * 토큰 주소 차단 (2026-11-06). GA4·Clarity 가 /invite/<토큰> 을 page_location 과 gzip 본문으로
 * 그대로 받는 것을 운영에서 관찰했다. 전송 값을 지우는 방식은 자동 수집 이벤트와 referrer 를 다 못 덮으므로
 * 토큰 주소를 연 문서에는 분석 스크립트를 아예 붙이지 않는다.
 *
 * 판정 기준은 ad-pixels.ts 의 TOKEN_PATHS·TOKEN_QUERY 한 곳이다. 여기는 그것을 인라인으로 옮길 뿐이다.
 * - 현재 주소나 같은 출처의 직전 페이지가 토큰 주소면 그 문서는 분석을 끈다.
 * - 분석이 도는 문서에서 SPA 로 토큰 주소에 가려 하면 pushState 전에 전체 이동으로 바꾼다.
 *   주소가 바뀌는 순간 자동 page_view 가 먼저 나가기 때문이다.
 * 학생 경로의 GA4·Clarity 는 건드리지 않는다.
 */
export const ANALYTICS_BLOCKED_FLAG = '__analyticsBlocked';

export const tokenUrlGuardScript = () =>
  `(function(w){var P=${JSON.stringify(TOKEN_PATHS)},Q=new RegExp(${JSON.stringify(TOKEN_QUERY.source)},${JSON.stringify(TOKEN_QUERY.flags)});` +
  'function t(u){try{var x=new URL(u,w.location.href);if(x.origin!==w.location.origin)return false;' +
  'for(var i=0;i<P.length;i++){if(x.pathname===P[i]||x.pathname.indexOf(P[i]+"/")===0)return true}' +
  'var b=false;x.searchParams.forEach(function(v,k){if(Q.test(k))b=true});return b}catch(e){return false}}' +
  `if(t(w.location.href)||(document.referrer&&t(document.referrer))){w.${ANALYTICS_BLOCKED_FLAG}=true;return}` +
  '[["pushState","assign"],["replaceState","replace"]].forEach(function(m){var o=w.history[m[0]];' +
  'w.history[m[0]]=function(s,n,u){if(u!=null&&t(String(u))){w.location[m[1]](String(u));return}return o.apply(this,arguments)}})' +
  '})(window);';
