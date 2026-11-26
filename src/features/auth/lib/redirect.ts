/**
 * 로그인 후 복귀(redirect) 관련 순수 함수 모음.
 *
 * 배경: 도전장 링크(`/invite/challenge/{token}`)에서 비로그인 사용자가
 * "가입하고 도전 받기" / "로그인"을 누르면 `?redirect=`로 원래 경로를 들고
 * 회원가입·로그인·역할선택(select-role)을 거쳐 그 경로로 되돌아가야 한다.
 * 스터디룸 초대 흐름이 이미 쓰고 있는 `token`/`from` 파라미터와 의미가 섞이지
 * 않도록 별도 파라미터명(`redirect`)을 쓴다.
 */

/**
 * 오픈 리다이렉트 가드: 앱 내부 절대경로(`/...`)만 허용한다.
 * 프로토콜 상대경로(`//`)·외부 URL(`http(s):`)·백슬래시 트릭은 차단.
 */
export const sanitizeRedirect = (raw?: string | null): string | null => {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return null;
  if (raw.includes('\\') || raw.startsWith('/\t')) return null;
  return raw;
};

/** 역할별 기본 착지. MVP-H 셸을 켠 학생만 승인 시안의 내 학습으로 보낸다. */
export const resolveRoleDestination = (
  role: string | null | undefined,
  shellEnabled: boolean
): string => {
  if (role !== 'ROLE_STUDENT') return '/dashboard';
  return shellEnabled ? '/dashboard/student' : '/learning';
};

/**
 * 로그인 성공 후 이동할 목적지를 계산한다.
 * - ROLE_MEMBER(프로필 미완성): select-role 로 보내되, 안전한 redirect 가 있으면
 *   쿼리로 함께 들고 가 프로필 완성 후 이어서 복귀할 수 있게 한다.
 * - 그 외: 안전한 redirect 우선, 없으면 역할별 기본 랜딩(roleDest).
 */
export const resolveLoginDestination = ({
  role,
  redirectTo,
  roleDest,
}: {
  role: 'ROLE_MEMBER' | string | null | undefined;
  redirectTo?: string | null;
  roleDest: string;
}): string => {
  const safeRedirect = sanitizeRedirect(redirectTo);
  if (role === 'ROLE_MEMBER') {
    return safeRedirect
      ? `/select-role?redirect=${encodeURIComponent(safeRedirect)}`
      : '/select-role';
  }
  return safeRedirect ?? roleDest;
};

/**
 * 세션 조회가 로그인 성공을 먼저 감지했을 때의 이동 경로를 계산한다.
 * 로그인 mutation과 세션 provider가 서로 다른 목적지로 이동시키지 않도록
 * redirect/from 처리와 역할별 기본 경로를 한 규칙으로 맞춘다.
 */
export const resolveSessionLoginDestination = ({
  role,
  token,
  redirect,
  from,
  shellEnabled = false,
}: {
  role: 'ROLE_MEMBER' | string | null | undefined;
  token?: string | null;
  redirect?: string | null;
  from?: string | null;
  shellEnabled?: boolean;
}): string => {
  if (token) {
    return `/dashboard?token=${encodeURIComponent(token)}`;
  }

  return resolveLoginDestination({
    role,
    redirectTo: redirect ?? from,
    roleDest: resolveRoleDestination(role, shellEnabled),
  });
};

/**
 * 회원가입 완료 후 로그인 페이지로 넘어갈 때 붙일 쿼리스트링을 만든다.
 * token(스터디룸 초대)·from·redirect(도전장 등 복귀 경로)를 있는 것만 담는다.
 */
/**
 * 카카오(OAuth) 로그인 버튼이 붙일 `state` 파라미터의 각 조각을 계산한다.
 *
 * 배경(Codex 교차 리뷰): 이메일 로그인/회원가입 경로는 도전장 등 복귀 경로를
 * `redirect` 쿼리 파라미터로 받지만, 카카오 버튼은 `token`(스터디룸 초대)·`from`
 * 만 state 에 실어 보내 `redirect` 가 유실됐다. 백엔드(OAuthStateContext/
 * PostLoginRedirectHandler)는 이미 `from` 값을 select-role·홈 경로에 그대로
 * 복원해주므로, `redirect` 가 있고 `from` 이 없으면 `redirect` 를 `from` 자리에
 * 실어 기존 배선을 그대로 재사용한다. `from` 이 이미 명시돼 있으면(스터디룸 초대
 * 흐름 등) 그 값을 그대로 우선한다.
 */
export const resolveOAuthFrom = ({
  from,
  redirect,
}: {
  from?: string | null;
  redirect?: string | null;
}): string | null => {
  if (from) return from;
  return sanitizeRedirect(redirect);
};

/**
 * OAuth 로그인 후 `/dashboard?from=...`로 착지했을 때 소비할 복귀 경로를 계산한다.
 *
 * 배경(Codex 2차 교차 리뷰): 기존 카카오 회원은 백엔드 `NormalRedirectHandler`가
 * `/dashboard?from=...`로 리다이렉트하는데, 대시보드 진입 지점에서 `from`을 그대로
 * `decodeURIComponent` 후 `startsWith('/')`로만 검사해 `sanitizeRedirect`가 막는
 * 프로토콜 상대경로(`//evil.com`) 같은 오픈 리다이렉트 케이스를 놓치고 있었다. 신규
 * 회원 select-role 경로(`resolveLoginDestination`)와 동일하게 `sanitizeRedirect`를
 * 거치도록 통일한다.
 *
 * `from` 값은 URL 인코딩된 채로 전달되므로 먼저 `decodeURIComponent`를 시도하고,
 * 디코딩 실패(잘못된 `%` 시퀀스 등) 시에도 예외를 던지지 않고 null을 반환한다.
 */
export const resolveDashboardFromRedirect = (
  from?: string | null
): string | null => {
  if (!from) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(from);
  } catch {
    return null;
  }
  return sanitizeRedirect(decoded);
};

export const buildPostSignupLoginQuery = ({
  inviteToken,
  from,
  redirect,
}: {
  inviteToken?: string | null;
  from?: string | null;
  redirect?: string | null;
}): string => {
  const params = new URLSearchParams();
  if (inviteToken) params.set('token', inviteToken);
  if (from) params.set('from', from);
  if (redirect) params.set('redirect', redirect);
  return params.toString();
};
