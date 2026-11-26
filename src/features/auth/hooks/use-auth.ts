import { useRouter } from 'next/navigation';

import { getCurrentMemberOptions, repository } from '@/entities/member';
import {
  resolveLoginDestination,
  resolveRoleDestination,
} from '@/features/auth/lib/redirect';
import { LoginBody } from '@/features/auth/types';
import { useSession } from '@/providers/session/session-context';
import { api } from '@/shared/api';
import { trackAuthLoginSuccess } from '@/shared/lib/analytics';
import { isMvpHShellEnabled } from '@/shared/lib/mvp-h-slice';
import { useMemberStore } from '@/store';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// 로그인 — redirectTo 가 주어지면(예: 도전장 링크) 로그인 후 그 경로로 복귀한다.
export const useLogin = (redirectTo?: string | null) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const loginRequest = async (body: LoginBody) => {
    return await api.bff.client.post('/api/v1/auth/login', body, {
      withCredentials: true,
    });
  };

  return useMutation({
    mutationFn: loginRequest,
    onSuccess: async () => {
      const member = await queryClient.fetchQuery(
        getCurrentMemberOptions(true)
      );
      // 로그인 성공 이벤트
      trackAuthLoginSuccess(member?.role ?? null);
      const roleDest = resolveRoleDestination(
        member?.role,
        isMvpHShellEnabled()
      );
      // 프로필 미완성(ROLE_MEMBER)은 역할선택을 우선하되, redirect 를 쿼리로 들고 가
      // 프로필 완성 후 SocialSelectRole 이 이어서 그 경로로 복귀시킨다.
      const dest = resolveLoginDestination({
        role: member?.role,
        redirectTo,
        roleDest,
      });
      router.replace(dest);
    },
  });
};

// 로그아웃
export const useLogout = () => {
  const queryClient = useQueryClient();
  const { clearMember } = useMemberStore();
  const router = useRouter();

  return useMutation({
    mutationFn: repository.member.logout,
    // 요청 성공/실패와 무관하게 상태 정리
    onSuccess: async () => {
      clearMember();
      queryClient.clear();
      router.replace('/');
    },
  });
};

// 인증 상태, 액션을 제공하는 허브
export const useAuth = (redirectTo?: string | null) => {
  const { mutate: login, isPending: isLoggingIn } = useLogin(redirectTo);
  const { mutateAsync: logout, isPending: isLoggingOut } = useLogout();
  const { member, refresh } = useSession();
  return { member, logout, isLoggingOut, login, isLoggingIn, refresh };
};
