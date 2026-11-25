import { OdokLogo } from '@/features/app-shell/components/odok-logo';

import LoginForm from './login-form';

/**
 * 오독공 로그인 화면(pub.login). 기존 LoginForm 을 그대로 쓰고 위에 브랜드 머리만 얹는다.
 * 전화번호 로그인은 SHELL_CAPABILITIES.phoneLogin 이 켜지기 전까지 그리지 않는다(입력칸 없음).
 */
export const OdokgongLogin = () => (
  <div className="gap-block-gap flex flex-col items-center">
    <OdokLogo className="mt-card-pad" />
    <p className="font-body2-normal text-gray-9">읽은 걸 내 말로 쓰는 공부</p>
    <LoginForm />
  </div>
);
