'use client';

import type { ReactNode } from 'react';

import { useOfficeSummaryQuery } from '@/features/app-shell/hooks/use-shell-queries';
import { useStudentDashboardStudyRoomListQuery } from '@/features/dashboard/hooks/use-student-dashboard-query';
import { useTeacherDashboardStudyRoomListQuery } from '@/features/dashboard/hooks/use-teacher-dashboard-query';
import { StudyroomSidebar } from '@/features/study-rooms/components/sidebar';
import { RoomCard } from '@/shared/components/room-card/room-card';
import { ScreenState } from '@/shared/components/screen-state';
import { Button } from '@/shared/components/ui/button';
import { Dialog } from '@/shared/components/ui/dialog';
import { SegmentedTabs } from '@/shared/components/ui/segmented-tabs';
import { PRIVATE } from '@/shared/constants';

type OfficeFrameProps = {
  studyRoomId: number;
  role: 'teacher' | 'student';
  /** 주소의 마지막 조각(note·homework·notice·qna·lesson). */
  segment: string;
  selectedGroupId: number | 'all';
  onSelectGroup: (id: number | 'all') => void;
  children: ReactNode;
};

const TABS = [
  { id: 'note', label: '강의', path: 'note' },
  { id: 'homework', label: '과제', path: 'homework' },
  { id: 'notice', label: '공지', path: 'notice' },
  { id: 'qna', label: '질문', path: 'qna' },
] as const;

/**
 * 교무실 틀(FDD §5.7). 머리 카드, 방 전환 칩(방이 둘 이상일 때), 탭 넷(주소로 가름), 본문.
 * 방 안 왼쪽 메뉴는 상시 열린 둘째 사이드바가 아니라 "방 메뉴" 서랍에 두고, 기능은 하나도 지우지 않는다.
 */
export const OfficeFrame = ({
  studyRoomId,
  role,
  segment,
  selectedGroupId,
  onSelectGroup,
  children,
}: OfficeFrameProps) => {
  const summaryQuery = useOfficeSummaryQuery(studyRoomId);
  const studentRooms = useStudentDashboardStudyRoomListQuery({
    enabled: role === 'student',
  });
  const teacherRooms = useTeacherDashboardStudyRoomListQuery({
    enabled: role === 'teacher',
  });
  const rooms =
    (role === 'student' ? studentRooms.data : teacherRooms.data) ?? [];
  const summary = summaryQuery.data;
  const forbidden =
    (summaryQuery.error as { response?: { status?: number } } | null)?.response
      ?.status === 403;
  const activeTab = segment === 'lesson' ? 'note' : segment;

  return (
    <div
      className="px-section-gap py-section-gap gap-block-gap mx-auto flex w-full max-w-280 flex-col"
      data-testid="office-frame"
    >
      <ScreenState
        status={
          forbidden
            ? 'forbidden'
            : summaryQuery.isError
              ? 'error'
              : summaryQuery.isPending
                ? 'loading'
                : 'ready'
        }
        error={{ onRetry: () => summaryQuery.refetch() }}
        forbidden={{ title: '이 방의 구성원만 볼 수 있어요' }}
      >
        {summary && (
          <RoomCard
            name={summary.roomName}
            teacherName={summary.teacherName}
            memberCounts={summary.memberCounts}
            noteCount={summary.noteCount}
          />
        )}
      </ScreenState>
      {!forbidden && (
        <>
          {rooms.length > 1 && (
            <div className="gap-content-gap flex flex-wrap">
              {rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  variant="chip"
                  name={room.name}
                  href={PRIVATE.ROOM.DETAIL(room.id)}
                  selected={room.id === studyRoomId}
                />
              ))}
            </div>
          )}
          <div className="gap-content-gap flex flex-wrap items-center justify-between">
            <SegmentedTabs
              ariaLabel="교무실 탭"
              variant="underline"
              value={activeTab}
              items={TABS.map((tab) => ({
                id: tab.id,
                label: tab.label,
                href: `/study-rooms/${studyRoomId}/${tab.path}`,
              }))}
            />
            <Dialog>
              <Dialog.Trigger asChild>
                <Button
                  variant="outlined"
                  size="compact"
                >
                  방 메뉴
                </Button>
              </Dialog.Trigger>
              <Dialog.Content className="p-card-pad w-120">
                <Dialog.Title className="font-headline2-heading">
                  방 메뉴
                </Dialog.Title>
                <StudyroomSidebar
                  studyRoomId={studyRoomId}
                  segment={segment}
                  selectedGroupId={selectedGroupId}
                  onSelectGroup={onSelectGroup}
                />
              </Dialog.Content>
            </Dialog>
          </div>
          <div>{children}</div>
        </>
      )}
    </div>
  );
};
