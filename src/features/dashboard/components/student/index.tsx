import { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';

import { useAssignedExamsQuery } from '@/features/exam/hooks/use-exam-query';
import { StudentTeacherInviteCard } from '@/features/teacher-invite/components/student-teacher-invite-card';
import { UnitNoteEntryCard } from '@/features/unit-note/components/unit-note-entry-card';
import { PageLayout } from '@/layout';
import { Card } from '@/shared/components/ui';
import { PRIVATE } from '@/shared/constants/route';
import { useMemberStore } from '@/store';

import { useReceivedConnectionList } from '../../connect/hooks/use-connection';
import { useStudentDashboardStudyRoomListQuery } from '../../hooks/use-student-dashboard-query';
import { AgendaFlowCard } from './agenda-flow-card';
import { ConfirmParentRequestDialog } from './confirm-dialog';
import { ExamHallCard } from './exam-hall-card';
import { TodayProblemsSection } from './today-problems-section';

const DashboardStudent = () => {
  const memberEmail = useMemberStore((s) => s.member?.email);
  const [isParentRequestDialogOpen, setIsParentRequestDialogOpen] =
    useState(false);
  const assignedExams = useAssignedExamsQuery();
  const studyRooms = useStudentDashboardStudyRoomListQuery();
  const inProgressExam = assignedExams.data?.find(
    (exam) => exam.status === 'IN_PROGRESS'
  );
  const query = {
    page: 0,
    size: 10,
    sort: 'regDate,DESC',
  };

  const { data: receivedData } = useReceivedConnectionList(query);
  const receivedParentRequest = useMemo(
    () =>
      receivedData?.connectionList.find(
        (connection) =>
          connection.state === 'PENDING' &&
          connection.recipientEmail === memberEmail
      ) ?? null,
    [memberEmail, receivedData?.connectionList]
  );

  useEffect(() => {
    if (!receivedParentRequest) return;

    setIsParentRequestDialogOpen(true);
  }, [receivedParentRequest]);

  return (
    <div className="max-w-shell mx-auto flex w-full flex-col">
      {/*
        v22 §1.3: 구획 패딩 16px(--gap-section) · 카드 간 간격 12px(--gap-block).
        DESIGN.md §4.2: 학생 대시보드는 표준 셸(max-w-shell, 1200px)로 통일한다.
        본문 폭은 위 mx-auto max-w-shell 이 잡으므로 PageLayout 은 width="fluid" 로
        중첩 제한(1180px)을 걸지 않는다.
      */}
      <PageLayout
        width="fluid"
        className="gap-block-gap relative flex flex-col"
      >
        {/* v22 §4 구획 머리줄(:1194-1198): 하단 2px 선, 구획 제목이 카드 제목보다 크다 */}
        <div className="border-gray-12 flex items-baseline gap-2 border-b-2 pb-2">
          <h2 className="text-gray-12 text-lg font-extrabold">지금 내 상태</h2>
          <p className="text-gray-9 text-xs">어디에 있고 무엇을 정리해 뒀나</p>
        </div>
        <ExamHallCard />
        <UnitNoteEntryCard />
        <div className="border-gray-4 mt-1 flex items-baseline gap-2 border-b-2 pb-2">
          <h2 className="text-gray-12 text-lg font-extrabold">오늘 할 것</h2>
          <p className="text-gray-9 text-xs">오늘 안에 닫는 일</p>
        </div>
        <TodayProblemsSection />
        <AgendaFlowCard />
        {!studyRooms.isPending && studyRooms.data?.length === 0 && (
          <StudentTeacherInviteCard compact />
        )}
        {inProgressExam && (
          <Card>
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-45 flex-1">
                <h2 className="text-gray-12 text-base font-extrabold">
                  이어 풀기
                </h2>
                <p className="text-gray-7 mt-1 text-xs">
                  {inProgressExam.title} · 풀던 시험으로 돌아갑니다
                </p>
              </div>
              <Link
                href={PRIVATE.DASHBOARD.EXAM_ATTEMPT(inProgressExam.attemptId)}
                className="bg-orange-9 border-orange-10 inline-flex min-h-11 items-center justify-center rounded-lg border px-4 text-xs font-extrabold text-white"
              >
                이어 풀기
              </Link>
            </div>
            {/*
              시안 v23 `.pbar`(HTML:670): 이어 풀기 진행 게이지.
              응시 API(assignedExam)에 답변한 문항 수 필드가 없어 실제 %를 계산할 수 없다
              (⛔ 데이터 없음: exam-hall-card.tsx `analyzedExam` 근처 스키마에도 없음).
              구조만 시안대로 두고 0%로 렌더한다. 백엔드에 answeredCount 필드가 붙으면
              `answeredCount / totalQuestions`로 채운다.
            */}
            <div
              className="bg-gray-2 mt-3 h-1.5 w-full overflow-hidden rounded-full"
              data-testid="in-progress-exam-gauge"
            >
              <div
                className="bg-orange-7 h-full rounded-full"
                style={{ width: '0%' }}
                role="progressbar"
                aria-label="이어 풀기 진행률(데이터 없음)"
                aria-valuemin={0}
                aria-valuemax={inProgressExam.totalQuestions}
                aria-valuenow={0}
              />
            </div>
          </Card>
        )}
      </PageLayout>
      <ConfirmParentRequestDialog
        connection={receivedParentRequest}
        open={isParentRequestDialogOpen}
        onOpenChange={setIsParentRequestDialogOpen}
      />
    </div>
  );
};

export default DashboardStudent;
