'use client';

import { useForm } from 'react-hook-form';

import { useRouter, useSearchParams } from 'next/navigation';

import { buildPostSignupLoginQuery } from '@/features/auth/lib/redirect';
import { Form } from '@/shared/components/ui/form';
import { PUBLIC } from '@/shared/constants';
import { useCheckboxGroup } from '@/shared/hooks/use-checkbox-group';
import {
  trackAuthSignupFail,
  trackAuthSignupSuccess,
  trackSignUpConversion,
} from '@/shared/lib/analytics';
import { createContextFactory } from '@/shared/lib/context';
import { zodResolver } from '@hookform/resolvers/zod';

import { RegisterForm } from '../schemas/register';
import { useSignUp } from '../services/query';
import { TERMS } from './terms-agreement';

type RegisterFormContextValue = {
  form: ReturnType<typeof useForm<RegisterForm>>;
  termsCheckboxGroup: ReturnType<
    typeof useCheckboxGroup<(typeof TERMS)[number]['value']>
  >;
  isAllRequiredTermsChecked: boolean;
};

const [RegisterFormContext, useRegisterFormContext] =
  createContextFactory<RegisterFormContextValue | null>('RegisterForm');
export { useRegisterFormContext };

export const RegisterFormContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const termsCheckboxGroup = useCheckboxGroup(TERMS.map((term) => term.value));

  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('token');
  const from = searchParams.get('from');
  // 도전장 등에서 넘어온 복귀 경로 — 스터디룸 초대의 `token`과는 별개 파라미터.
  // 회원가입 완료 후 로그인 페이지로 넘어갈 때 끝까지 들고 간다(로그인 후 이 경로로 복귀).
  const redirect = searchParams.get('redirect');

  const form = useForm<RegisterForm>({
    resolver: zodResolver(RegisterForm),
    mode: 'onChange', // 실시간 검증 활성화
    defaultValues: {
      email: '',
      verificationCode: '',
      password: '',
      confirmPassword: '',
      role: inviteToken ? 'ROLE_STUDENT' : 'ROLE_TEACHER',
      name: '',
      phoneNumber: '',
    },
  });

  const { mutate: signUp, isPending } = useSignUp();

  const isAllRequiredTermsChecked = TERMS.filter((term) => term.required).every(
    (term) => termsCheckboxGroup.checkedItems.includes(term.value)
  );

  const onSubmit = form.handleSubmit((data) => {
    if (isPending) return;

    signUp(
      {
        email: form.getValues('email'),
        password: form.getValues('password'),
        phoneNumber: data.phoneNumber.replace(/-/g, ''),
        agreeServiceTerms: termsCheckboxGroup.checkedItems.includes('terms'),
        agreePrivacyTerms: termsCheckboxGroup.checkedItems.includes('privacy'),
        agreeAgeCheck: termsCheckboxGroup.checkedItems.includes('ageCheck'),
        agreeMarketing: termsCheckboxGroup.checkedItems.includes('marketing'),
        name: data.name,
        role: data.role,
      },
      {
        onSuccess: () => {
          // 회원가입 성공 이벤트
          trackAuthSignupSuccess(data.role ?? null, 'email');
          trackSignUpConversion('email');
          const query = buildPostSignupLoginQuery({
            inviteToken,
            from,
            redirect,
          });
          router.replace(
            query ? `${PUBLIC.CORE.LOGIN}?${query}` : PUBLIC.CORE.LOGIN
          );
        },
        onError: () => {
          trackAuthSignupFail('email');
          alert('회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.');
        },
      }
    );
  });

  return (
    <RegisterFormContext
      value={{
        form,
        termsCheckboxGroup,
        isAllRequiredTermsChecked,
      }}
    >
      <Form onSubmit={onSubmit}>{children}</Form>
    </RegisterFormContext>
  );
};
