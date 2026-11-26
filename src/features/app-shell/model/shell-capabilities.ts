/**
 * 오독공 앱 틀 능력 상수(FDD v3.0.2 §4.1).
 * 조각 2·3 이 아직 만들지 않은 화면으로 가는 메뉴·탭·칩이 죽은 버튼으로 남지 않게,
 * false 인 능력은 그리지 않는다. 각 조각 PR 이 해당 값을 true 로 바꾼다(환경변수 아님).
 */
export const SHELL_CAPABILITIES = {
  schedule: true,
  pins: true,
  program: true,
  // Exact S04~S07 token/problem/media contract is not complete in slice 3 v1.0.0.
  levelTest: false,
  ebookLibrary: true,
  bestNotes: true,
  declarations: true,
  homeReviews: false,
  phoneLogin: false,
} as const;

export type ShellCapability = keyof typeof SHELL_CAPABILITIES;
