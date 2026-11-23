import { useSyncExternalStore } from 'react';

import { MemberDTO } from '@/entities/member';
import { fetchMemberInfo } from '@/features/member/api/member.api';
import { queryKey } from '@/shared/constants/query-key';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const subscribeNothing = () => () => {};
/** 서버와 하이드레이션 첫 렌더에서는 false, 그 뒤와 클라이언트 전환에서는 true. */
const useHydrated = () =>
  useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false
  );

/**
 * [TODO 임시 버전]
 * Access Token을 직접 디코딩하여 세션 정보를 복원합니다.
 *
 * 주의: 현재 백엔드에서 사용자 정보 불러오기 API가 제공되지 않아 임시로 JWT를 해석합니다.
 * 배포 시 AccessToken이 HttpOnly로 변경되면 이 방식은 동작하지 않습니다.
 * 이후 API 기반 세션 복원(getSession)으로 교체 예정입니다.
 */
export const useRole = () => {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKey.session,
    queryFn: fetchMemberInfo,
    initialData: () => qc.getQueryData<MemberDTO>(queryKey.session),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false,
  });

  // 서버 HTML 은 세션 캐시가 비어 있는 상태로 그려진다. 하이드레이션 도중 다른 컴포넌트가 먼저 세션을
  // 받아 캐시가 차면 이 훅이 첫 렌더에서 서버와 다른 역할을 돌려줘 #418 이 난다(M-7). 그래서 하이드레이션
  // 첫 렌더는 서버와 같은 값(역할 없음, 로딩 중)을 돌려주고 바로 다음 렌더에서 실제 값을 준다.
  const hydrated = useHydrated();
  return {
    role: hydrated ? data?.role : undefined,
    isLoading: hydrated ? isLoading : true,
  };
};
