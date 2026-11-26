'use client';

import { useForm } from 'react-hook-form';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import SocialLoginButton from '@/features/auth/components/social-login-button';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Button } from '@/shared/components/ui/button';
import { Form } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { PUBLIC } from '@/shared/constants';
import {
  trackAuthLoginClick,
  trackAuthLoginFail,
} from '@/shared/lib/analytics';
import { extractErrorMessage } from '@/shared/lib/bff/utils.message';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';

import { LoginFormValues, loginSchema } from '../schemas/login';

const LoginFormtwStyles = {
  wrapper: 'space-y-10 pb-10 pt-4',
  link: 'text-key-color-primary min-h-touch-min shell:min-h-0 inline-flex w-fit items-center px-2 underline tablet:px-0',
};

export default function LoginForm() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('token');
  const from = searchParams.get('from');
  // 도전장 등에서 넘어온 복귀 경로 — 로그인 후 이 경로로 되돌아간다.
  // 기존 링크 호환: redirect 가 없으면 from 을 대신 읽는다(둘 다 실제 복귀에 반영).
  const redirect = searchParams.get('redirect') ?? from;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  const { login, isLoggingIn } = useAuth(redirect);

  const onSubmit = async (data: LoginFormValues) => {
    trackAuthLoginClick();

    login(data, {
      onError: (error) => {
        trackAuthLoginFail();
        let message = '로그인에 실패하였습니다. 잠시 후 다시 시도해주세요.';

        if (error instanceof AxiosError) {
          const serverMessage = extractErrorMessage(error.response?.data);
          message = serverMessage || message;
        }

        setError('password', {
          type: 'server',
          message,
        });
      },
    });
  };

  const isLoading = isLoggingIn || isSubmitting;
  const isInValid = Object.keys(errors).length > 0;

  const getSignupHref = () => {
    const params = new URLSearchParams();
    if (inviteToken) params.set('token', inviteToken);
    if (from) params.set('from', from);
    if (redirect) params.set('redirect', redirect);
    const query = params.toString();
    return query ? `${PUBLIC.CORE.SIGNUP}?${query}` : PUBLIC.CORE.SIGNUP;
  };

  return (
    <>
      <p className="mt-10 w-fit text-xl font-medium">소셜 로그인</p>
      <SocialLoginButton />

      <div className="text-text-sub2 mt-10 flex items-center justify-between gap-1">
        <hr className="border-line-line2 flex-1 border" />
        <span>D&apos;edu로 이메일로 로그인</span>
        <hr className="border-line-line2 flex-1 border" />
      </div>

      <Form
        method="post"
        onSubmit={handleSubmit(onSubmit)}
        className={LoginFormtwStyles.wrapper}
      >
        <Form.Item error={!!errors.email}>
          <Form.Label>이메일</Form.Label>
          <Form.Control>
            <Input
              type="email"
              data-testid="login-email-input"
              {...register('email')}
            />
          </Form.Control>
          <Form.ErrorMessage>{errors.email?.message}</Form.ErrorMessage>
        </Form.Item>

        <Form.Item error={!!errors.password}>
          <Form.Label>비밀번호</Form.Label>
          <Form.Control>
            <Input
              type="password"
              data-testid="login-password-input"
              {...register('password')}
            />
          </Form.Control>
          <Form.ErrorMessage>{errors.password?.message}</Form.ErrorMessage>
        </Form.Item>

        <Button
          type="submit"
          disabled={isLoading || isInValid}
          className="w-full"
          data-testid="login-submit-button"
        >
          {isLoading ? '로그인 중...' : '계속'}
        </Button>

        <div className="flex justify-center gap-2">
          <span>아직 회원이 아니신가요?</span>
          <Link
            href={getSignupHref()}
            className={LoginFormtwStyles.link}
          >
            회원가입
          </Link>
        </div>
      </Form>
    </>
  );
}
