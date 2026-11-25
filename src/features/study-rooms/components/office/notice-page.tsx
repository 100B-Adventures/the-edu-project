'use client';

import { ScreenState } from '@/shared/components/screen-state';
import { useRole } from '@/shared/hooks/use-role';

import { NoticeList } from './notice-list';

/** 공지 탭 본문. 역할은 세션에서 읽고, 로딩 중에는 그리지 않는다. */
export const NoticePage = ({ roomId }: { roomId: number }) => {
  const { role, isLoading } = useRole();
  if (isLoading) return <ScreenState status="loading" />;
  if (role !== 'ROLE_TEACHER' && role !== 'ROLE_STUDENT') {
    return (
      <ScreenState
        status="forbidden"
        forbidden={{ title: '학생과 선생님만 공지를 볼 수 있어요' }}
      />
    );
  }
  return (
    <NoticeList
      roomId={roomId}
      role={role === 'ROLE_TEACHER' ? 'teacher' : 'student'}
    />
  );
};
