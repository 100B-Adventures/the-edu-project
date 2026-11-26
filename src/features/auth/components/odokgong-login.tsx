import LoginForm from './login-form';

/**
 * 오독공 로그인 화면(pub.login). 승인 v3.25.0은 기존 로그인 화면을 유지하므로
 * AuthBanner 아래에 LoginForm 을 전체 폭으로 그대로 둔다.
 * 전화번호 로그인은 SHELL_CAPABILITIES.phoneLogin 이 켜지기 전까지 그리지 않는다(입력칸 없음).
 */
export const OdokgongLogin = () => (
  <div className="w-full">
    <LoginForm />
  </div>
);
