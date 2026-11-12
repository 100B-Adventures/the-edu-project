'use client';

import { useEffect, useState } from 'react';

import { useRegisterFormContext } from '@/features/auth/components/register-form-context-provider';
import { Button } from '@/shared/components/ui/button';
import { Form } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { useCountdown } from '@/shared/hooks/use-countdown';
import { AxiosError } from 'axios';

import { useCheckEmailDuplicate, useVerifyCode } from '../services/query';
import { TermsAgreement } from './terms-agreement';

// 서버가 같은 이메일로 1분에 1회만 발송하므로 같은 값으로 맞춘다.
const RESEND_COUNTDOWN = 60;
const RATE_LIMIT_MESSAGE = '잠시 뒤 다시 시도해 주세요. (최대 10분)';
const VERIFICATION_CODE_LENGTH = 6;

type CredentialStepProps = {
  onNext: () => void;
};

export const CredentialStep = ({ onNext }: CredentialStepProps) => {
  const [emailCodeVerified, setEmailCodeVerified] = useState(false);

  const { countdown: resendCountdown, startCountdown } =
    useCountdown(RESEND_COUNTDOWN);

  const { mutate: checkEmailDuplicate, isPending: isCheckingEmailDuplicate } =
    useCheckEmailDuplicate();

  const { mutate: verifyCode, isPending: isVerifyingCode } = useVerifyCode();

  const canResend = resendCountdown === null;

  const { form, termsCheckboxGroup, isAllRequiredTermsChecked } =
    useRegisterFormContext();

  const onSendButtonClick = () => {
    if (isCheckingEmailDuplicate) return;

    checkEmailDuplicate(
      {
        email: form.getValues('email'),
      },
      {
        onSuccess: () => {
          setEmailCodeVerified(false);
          startCountdown();
        },
        onError: (error: unknown) => {
          // 429(발송·확인 횟수 제한)는 전용 문구로 안내한다.
          const rateLimited =
            error instanceof AxiosError && error.response?.status === 429;
          form.setError('verificationCode', {
            message: rateLimited
              ? RATE_LIMIT_MESSAGE
              : '인증 메일을 보내지 못했어요. 잠시 후 다시 시도해주세요.',
          });
          if (rateLimited) startCountdown();
        },
      }
    );
  };

  const onVerifyCodeButtonClick = () => {
    if (isVerifyingCode) return;

    verifyCode(
      {
        email: form.getValues('email'),
        code: form.getValues('verificationCode'),
      },
      {
        onSuccess: () => {
          setEmailCodeVerified(true);
          form.clearErrors('verificationCode');
        },
        onError: (error: unknown) => {
          const rateLimited =
            error instanceof AxiosError && error.response?.status === 429;
          form.setError('verificationCode', {
            message: rateLimited
              ? RATE_LIMIT_MESSAGE
              : '올바른 인증코드가 아닙니다.',
          });
        },
      }
    );
  };

  const onNextButtonClick = async () => {
    const isValid = await form.trigger(['password', 'confirmPassword']);

    if (isValid) {
      onNext();
    }
  };

  // 비밀번호와 비밀번호 확인 필드의 유효성 확인
  const password = form.watch('password');
  const confirmPassword = form.watch('confirmPassword');
  const passwordError = form.formState.errors.password;
  const confirmPasswordError = form.formState.errors.confirmPassword;
  const isPasswordValid = !passwordError && password && password.length > 0;
  const isConfirmPasswordValid =
    !confirmPasswordError &&
    confirmPassword &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  // 모든 조건이 만족될 때만 '계속' 버튼 활성화
  const canMoveToNext =
    isAllRequiredTermsChecked &&
    emailCodeVerified &&
    isPasswordValid &&
    isConfirmPasswordValid;

  const verificationCodeInputValue = form.watch('verificationCode');

  // 비밀번호 입력 시 실시간 검증
  useEffect(() => {
    if (password) {
      void form.trigger('password');
    }
  }, [password, form]);

  // 비밀번호 확인 입력 시 실시간 검증
  useEffect(() => {
    if (confirmPassword) {
      void form.trigger(['password', 'confirmPassword']);
    }
  }, [confirmPassword, form]);

  return (
    <div className="flex flex-col gap-8">
      <Form.Item>
        <Form.Label>이메일</Form.Label>
        <div className="flex">
          <Form.Control>
            <Input
              className="rounded-r-none border-r-0"
              defaultValue={form.getValues('email')}
              readOnly
            />
          </Form.Control>
          <Button
            variant="secondary"
            className="h-14 rounded-l-none"
            disabled={!canResend}
            onClick={onSendButtonClick}
          >
            {resendCountdown !== null
              ? `${resendCountdown}초 후 재전송`
              : '전송'}
          </Button>
        </div>
      </Form.Item>
      <Form.Item error={!!form.formState.errors.verificationCode}>
        <Form.Label>인증코드</Form.Label>
        <div className="flex">
          <Form.Control>
            <Input
              disabled={emailCodeVerified}
              maxLength={VERIFICATION_CODE_LENGTH}
              className="rounded-r-none border-r-0"
              placeholder="이메일로 전송된 숫자 코드 여섯자리"
              {...form.register('verificationCode')}
            />
          </Form.Control>

          <Button
            className="h-14 rounded-l-none"
            onClick={onVerifyCodeButtonClick}
            disabled={
              emailCodeVerified ||
              verificationCodeInputValue.length !== VERIFICATION_CODE_LENGTH
            }
          >
            확인
          </Button>
        </div>
        <Form.ErrorMessage>
          {form.formState.errors.verificationCode?.message}
        </Form.ErrorMessage>
      </Form.Item>
      <Form.Item error={!!form.formState.errors.password}>
        <Form.Label>비밀번호</Form.Label>
        <Form.Control>
          <Input
            type="password"
            placeholder="8자 이상의 영문 대·소문자 및 숫자, 특수문자"
            {...form.register('password')}
          />
        </Form.Control>
        <Form.ErrorMessage>
          {form.formState.errors.password?.message}
        </Form.ErrorMessage>
      </Form.Item>
      <Form.Item error={!!form.formState.errors.confirmPassword}>
        <Form.Label>비밀번호 확인</Form.Label>
        <Form.Control>
          <Input
            type="password"
            placeholder="8자 이상의 영문 대·소문자 및 숫자, 특수문자"
            {...form.register('confirmPassword')}
          />
        </Form.Control>
        <Form.ErrorMessage>
          {form.formState.errors.confirmPassword?.message}
        </Form.ErrorMessage>
      </Form.Item>
      <TermsAgreement
        isAllChecked={termsCheckboxGroup.isAllChecked}
        toggleAll={termsCheckboxGroup.toggleAll}
        getCheckboxProps={termsCheckboxGroup.getCheckboxProps}
      />
      <Button
        size="large"
        onClick={onNextButtonClick}
        disabled={!canMoveToNext}
      >
        계속
      </Button>
    </div>
  );
};
