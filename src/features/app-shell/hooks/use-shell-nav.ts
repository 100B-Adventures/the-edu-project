import { useMemo } from 'react';

import { useTeacherDashboardStudyRoomListQuery } from '@/features/dashboard/hooks/use-teacher-dashboard-query';
import { isMvpHSliceEnabled } from '@/shared/lib/mvp-h-slice';

import { buildShellNav } from '../model/nav-config';
import { useShellTrackQuery } from './use-shell-track';

export type ShellRole = 'ROLE_STUDENT' | 'ROLE_TEACHER';

/** 역할·트랙·대표 방으로 사이드바와 하단 탭 항목을 만든다. 데이터가 오기 전에는 방 항목 없이 그린다. */
export const useShellNav = (role: ShellRole) => {
  const isStudent = role === 'ROLE_STUDENT';
  const trackQuery = useShellTrackQuery(isStudent);
  const teacherRooms = useTeacherDashboardStudyRoomListQuery({
    enabled: !isStudent,
  });
  const roomId = isStudent
    ? (trackQuery.data?.primaryStudyRoomId ?? null)
    : (teacherRooms.data?.[0]?.id ?? null);
  const track = trackQuery.data?.track;
  const sliceOneEnabled = isMvpHSliceEnabled();

  return useMemo(
    () => buildShellNav({ role, track, roomId, sliceOneEnabled }),
    [role, track, roomId, sliceOneEnabled]
  );
};
