'use client';

import { useForm } from 'react-hook-form';

import { useRouter, useSearchParams } from 'next/navigation';

import { ProfileForm } from '@/features/auth/components/profile-form';
import {
  resolveDashboardFromRedirect,
  sanitizeRedirect,
} from '@/features/auth/lib/redirect';
import { SocialRegisterForm } from '@/features/auth/schemas/social-register';
import { useUpdateProfile } from '@/features/auth/services/query';
import { useAcceptInvitation } from '@/features/invite/hooks';
import { useSession } from '@/providers/session/session-context';
import { Form } from '@/shared/components/ui';
import { PRIVATE, PUBLIC } from '@/shared/constants';
import {
  trackAuthSignupFail,
  trackAuthSignupSuccess,
  trackSignUpConversion,
} from '@/shared/lib/analytics';
import { zodResolver } from '@hookform/resolvers/zod';

export const SocialSelectRole = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('token');
  const from = searchParams.get('from');
  // 도전장 등에서 넘어온 복귀 경로(스터디룸 초대 `token`과는 별개 파라미터).
  // 이 페이지는 쿼리로 직접 진입될 수도 있으므로(URL 조작) 오픈 리다이렉트 가드를
  // 여기서도 다시 적용한다 — 앱 내부 절대경로(`/...`)만 허용.
  const redirect = sanitizeRedirect(searchParams.get('redirect'));
  const session = useSession();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const { acceptInvitation } = useAcceptInvitation();

  const form = useForm<SocialRegisterForm>({
    resolver: zodResolver(SocialRegisterForm),
    mode: 'onChange',
    defaultValues: {
      role: inviteToken ? 'ROLE_STUDENT' : 'ROLE_TEACHER',
      name: '',
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    updateProfile(data, {
      onSuccess: async () => {
        trackAuthSignupSuccess(data.role, 'kakao');
        trackSignUpConversion('kakao');

        await session.refresh();
        if (inviteToken) {
          if (data.role === 'ROLE_STUDENT') {
            acceptInvitation(inviteToken);
          } else {
            router.push(PUBLIC.CORE.INVITE.ERROR('ROLE_NOT_MATCH'));
          }
        } else {
          // redirect 를 우선하고, 기존 링크 호환을 위해 from 도 같은 가드를 거쳐 받는다.
          const safeFrom = resolveDashboardFromRedirect(from);
          router.push(redirect ?? safeFrom ?? PRIVATE.DASHBOARD.INDEX);
        }
      },
      onError: () => {
        trackAuthSignupFail('kakao');
        alert('프로필 완성에 실패했습니다. 다시 시도해주세요.');
      },
    });
  });

  return (
    <Form onSubmit={handleSubmit}>
      <h1 className="text-gray-black tablet:mt-29.25 tablet:mb-14.25 tablet:font-title-heading mt-14.25 mb-6.75 text-2xl font-bold">
        <span className="text-orange-7">프로필</span> 만들기
      </h1>
      <ProfileForm
        form={form}
        buttonText={isPending ? '처리 중...' : '프로필 완성'}
      />
    </Form>
  );
};
