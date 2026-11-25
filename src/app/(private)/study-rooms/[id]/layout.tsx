'use client';

import React, { useEffect, useState } from 'react';

import { useParams, usePathname, useRouter } from 'next/navigation';

import { StudyNoteTab } from '@/features/study-notes/components/study-note-tab';
import { StudyNoteTabShell } from '@/features/study-notes/components/study-note-tab-shell';
import { StudyNoteGroupContext } from '@/features/study-notes/contexts/study-note-group.context';
import { OfficeFrame } from '@/features/study-rooms/components/office/office-frame';
import { StudyroomSidebar } from '@/features/study-rooms/components/sidebar';
import { ColumnLayout } from '@/layout/column-layout';
import { useRole } from '@/shared/hooks/use-role';
import { cn } from '@/shared/lib';
import {
  isMvpHShellEnabled,
  isMvpHSliceEnabled,
} from '@/shared/lib/mvp-h-slice';

type LayoutProps = {
  children: React.ReactNode;
};

const StudyNoteLayout = ({ children }: LayoutProps) => {
  const { role, isLoading } = useRole();
  const path = usePathname();
  const params = useParams();
  const router = useRouter();
  const studyRoomId = Number(params.id);

  const [selectedGroupId, setSelectedGroupId] = useState<number | 'all'>('all');

  const pathSegments = path.split('/').filter(Boolean);
  const segment = pathSegments[pathSegments.length - 1];
  const secondLastSegment = pathSegments[pathSegments.length - 2];
  const isHomeworkRoute = pathSegments.includes('homework');

  const isNote = segment === 'note';
  // 1:1 수업 화면은 좁은 폭에서 방 요약 카드보다 수업 내용이 먼저 보여야 한다.
  const isLesson = segment === 'lesson' && isMvpHSliceEnabled();

  const isEditOrWritePage =
    segment === 'edit' ||
    segment === 'new' ||
    (secondLastSegment === 'note' && segment === 'new');

  const isDetailPage =
    !isEditOrWritePage &&
    ((pathSegments.length > 3 && secondLastSegment === 'qna') ||
      (pathSegments.length > 3 && secondLastSegment === 'note') ||
      (pathSegments.length > 3 && secondLastSegment === 'homework'));

  // 권한 체크
  // Todo: 추후 미들웨어에서 처리하도록 변경
  useEffect(() => {
    if (isLoading) return;
  }, [role, segment, isLoading, router, studyRoomId]);

  // write/edit routes bypass this layout
  if (isEditOrWritePage) {
    return <>{children}</>;
  }

  // 기존 homework 중첩 layout 은 셸이 꺼졌을 때 이 layout 을 통째로 우회한다.
  // 상세 여부보다 먼저 판정해야 /homework/:id 가 ColumnLayout 에 이중으로 감싸지지 않는다.
  if (!isMvpHShellEnabled() && isHomeworkRoute) {
    return <>{children}</>;
  }

  if (isDetailPage) {
    return (
      <ColumnLayout className="desktop:p-6 items-start gap-6">
        {children}
      </ColumnLayout>
    );
  }

  // mvp-h shell: 켜면 교무실 틀(머리 카드·탭 넷·방 메뉴 서랍). 방 안 왼쪽 사이드바는 서랍으로 들어간다.
  const isOfficeSegment =
    segment === 'note' ||
    segment === 'homework' ||
    segment === 'lesson' ||
    segment === 'qna' ||
    segment === 'notice';
  if (
    isMvpHShellEnabled() &&
    isOfficeSegment &&
    (role === 'ROLE_TEACHER' || role === 'ROLE_STUDENT')
  ) {
    return (
      <StudyNoteGroupContext.Provider
        value={{ selectedGroupId, setSelectedGroupId }}
      >
        <OfficeFrame
          studyRoomId={studyRoomId}
          role={role === 'ROLE_TEACHER' ? 'teacher' : 'student'}
          segment={segment!}
          selectedGroupId={selectedGroupId}
          onSelectGroup={setSelectedGroupId}
        >
          {children}
        </OfficeFrame>
      </StudyNoteGroupContext.Provider>
    );
  }

  // 셸이 켜져 있어도 OfficeFrame 대상이 아닌 homework 경로는 기존 중첩 layout 에 맡긴다.
  if (isHomeworkRoute) {
    return <>{children}</>;
  }

  return (
    <StudyNoteGroupContext.Provider
      value={{ selectedGroupId, setSelectedGroupId }}
    >
      <div data-study-room-shell>
        <ColumnLayout className="shell:flex-row shell:px-4 shell:py-4 items-start gap-5">
          <ColumnLayout.Left
            className={cn(
              'shell:sticky shell:top-4 shell:w-room-aside',
              isLesson && 'max-shell:hidden'
            )}
          >
            <StudyroomSidebar
              studyRoomId={studyRoomId}
              segment={segment}
              selectedGroupId={selectedGroupId}
              onSelectGroup={setSelectedGroupId}
            />
          </ColumnLayout.Left>
          <ColumnLayout.Right className="rounded-card shell:max-w-none shell:px-0 flex h-auto min-w-0 flex-1 flex-col gap-3">
            <div>
              <StudyNoteTab
                mode={role}
                studyRoomId={studyRoomId}
                path={segment!}
              />
              <div className="border-line-line1 flex flex-col gap-9 rounded-tr-[12px] rounded-b-[12px] border bg-white p-8">
                <StudyNoteTabShell
                  mode={role}
                  path={segment!}
                  studyRoomId={studyRoomId}
                />
                {!isNote && children}
              </div>
            </div>
            {isNote && children}
          </ColumnLayout.Right>
        </ColumnLayout>
      </div>
    </StudyNoteGroupContext.Provider>
  );
};

export default StudyNoteLayout;
