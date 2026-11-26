/**
 * mvp-h(오독공) 조각 1 노출 스위치.
 * 켜면 N회독·풀이노트·1:1 수업노트 진입점이 보이고, 제출 뒤 풀이 화면이 풀이노트로 이어진다.
 * 규칙:
 * - NEXT_PUBLIC_MVPH_SLICE1 = 'on' 이면 켠다, 'off' 이면 끈다.
 * - 값이 없으면 NEXT_PUBLIC_APP_ENV 가 'dev' 또는 'preview' 일 때만 켠다(스테이징·프리뷰 기본 노출).
 * - 값이 없고 production·local·그 밖의 값이면 끈다. 운영 MVP-G 동선은 한 비트도 바뀌지 않는다.
 * NEXT_PUBLIC_ 값은 빌드 때 박히므로 켜고 끄려면 다시 빌드한다.
 */
export const isMvpHSliceEnabled = (): boolean => {
  const flag = process.env.NEXT_PUBLIC_MVPH_SLICE1;
  if (flag === 'on') return true;
  if (flag === 'off') return false;
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV;
  return appEnv === 'dev' || appEnv === 'preview';
};

/**
 * mvp-h(오독공) shell 조각 노출 스위치. 켜면 새 앱 틀(OdokgongShell)과 12화면이 보인다.
 * 규칙은 조각 1 스위치와 같다. 하네스 호환을 위해 'on'·'true' 는 켜고 'off'·'false' 는 끈다.
 * 끄면 기존 DashboardSidebar·StudyroomSidebar 와 모든 주소가 그대로다.
 * NEXT_PUBLIC_ 값은 빌드 때 박히므로 process.env 를 리터럴로 읽는다.
 */
export const isMvpHShellEnabled = (): boolean => {
  const flag = process.env.NEXT_PUBLIC_MVPH_SHELL;
  if (flag === 'on' || flag === 'true') return true;
  if (flag === 'off' || flag === 'false') return false;
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV;
  return appEnv === 'dev' || appEnv === 'preview';
};
