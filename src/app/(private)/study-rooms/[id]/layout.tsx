'use client';

import React, { useEffect, useState } from 'react';

import { useParams, usePathname, useRouter } from 'next/navigation';

import { StudyNoteTab } from '@/features/study-notes/components/study-note-tab';
import { StudyNoteTabShell } from '@/features/study-notes/components/study-note-tab-shell';
import { StudyNoteGroupContext } from '@/features/study-notes/contexts/study-note-group.context';
import { StudyroomSidebar } from '@/features/study-rooms/components/sidebar';
import { ColumnLayout } from '@/layout/column-layout';
import { useRole } from '@/shared/hooks/use-role';
import { isMvpHSliceEnabled } from '@/shared/lib/mvp-h-slice';
import { cn } from '@/shared/lib';

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

  // homework routes are handled by /homework/layout.tsx
  if (isHomeworkRoute) {
    return <>{children}</>;
  }

  if (isDetailPage) {
    return (
      <ColumnLayout className="desktop:p-6 items-start gap-6">
        {children}
      </ColumnLayout>
    );
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
