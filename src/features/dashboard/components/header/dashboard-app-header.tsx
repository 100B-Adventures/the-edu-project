'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';

import { useStudentGrowthQuery } from '@/features/dashboard/hooks/use-growth-query';
import { useParentDashboardReportQuery } from '@/features/dashboard/hooks/use-parent-dashboard-query';
import { useTeacherDashboardStudyRoomListQuery } from '@/features/dashboard/hooks/use-teacher-dashboard-query';
import { useWrongAnswersQuery } from '@/features/dashboard/hooks/use-wrong-answer-query';
import { useMyPointWalletQuery } from '@/features/point/hooks/use-point';
import { cn } from '@/shared/lib';
import { useMemberStore } from '@/store';

import { HeaderReport, type HeaderStat } from './report';

type DashboardAppHeaderProps = {
  initialMemberName: string;
  role: string;
};

const STUDENT_TITLE_BY_PATH: Array<[RegExp, string]> = [
  [/^\/dashboard\/student\/results\/?$/, '내 성과'],
  [/^\/dashboard\/student\/look-back\/?$/, '돌아보기'],
  [/^\/dashboard\/student\/wrong-answers(\/.*)?$/, '오답 회독'],
  [/^\/dashboard\/student\/unit-notes(\/.*)?$/, '단권화 노트'],
  [/^\/dashboard\/student\/exam-hall\/?$/, '응시장'],
  [/^\/dashboard\/student\/exams(\/.*)?$/, '시험 응시'],
  [/^\/tree\/?$/, '약점 트리'],
  // 실제 친구 화면은 `/friends`(및 하위 상세)다. `/dashboard/connections`는 쓰이지
  // 않는 스텁이라 이 규칙에 걸리지 않았고, 그 결과 `/friends`가 앱바 폴백값
  // "내 학습"으로 오표기됐다(2026-08-27). 더 구체적인 대결 결과 규칙을 먼저 둬
  // 순서 우선으로 겹치지 않게 한다.
  [/^\/friends\/challenge\/.+\/result\/?$/, '대결 결과'],
  [/^\/friends(\/.*)?$/, '친구'],
  [/^\/dashboard\/qna(\/.*)?$/, '질문'],
  [/^\/points\/?$/, '포인트'],
  [/^\/mypage(\/.*)?$/, '마이페이지'],
  [/^\/settings\/?$/, '환경설정'],
];

const STUDENT_PATHS_WITHOUT_SUMMARY = [
  /^\/tree\/?$/,
  /^\/friends(\/.*)?$/,
  /^\/dashboard\/qna(\/.*)?$/,
  /^\/points\/?$/,
  /^\/settings\/?$/,
];

export const studentAppBarTitle = (pathname: string): string => {
  const matched = STUDENT_TITLE_BY_PATH.find(([pattern]) =>
    pattern.test(pathname)
  );
  return matched ? matched[1] : '내 학습';
};

const StudentSummaryChips = ({ memberName }: { memberName: string }) => {
  const growthQuery = useStudentGrowthQuery();
  const pointQuery = useMyPointWalletQuery();
  const wrongAnswersQuery = useWrongAnswersQuery();
  const wrongAnswerCount = wrongAnswersQuery.data?.totalCount ?? 0;
  const streakDays = growthQuery.data?.streakDays ?? 0;
  const level = growthQuery.data?.level ?? 0;
  const pointBalance = pointQuery.data?.balance ?? 0;
  // v12 D-034는 포인트 기능과 데이터를 삭제하지 않고 학생 화면에서만 가린다.
  // 연속·레벨 칩은 기존 계약대로 모바일에서만 숨기고, 포인트 칩은 모든 폭에서 숨긴다.
  const chips = [
    ['내 오답', `${wrongAnswerCount}개`, false, false],
    ['연속', `${streakDays}일`, true, false],
    [null, `Lv.${level}`, true, false],
    ['포인트', `${pointBalance.toLocaleString('ko-KR')}P`, false, true],
  ] as const;

  return (
    <div className="gap-inline-gap flex flex-wrap items-center justify-end">
      {chips.map(([label, value, hideOnMobile, hideByD034]) => (
        <span
          key={label ?? value}
          className={`bg-gray-1 text-gray-9 text-ui-choice min-h-chip-min rounded-pill px-button-chip-x items-center font-bold ${hideByD034 ? 'hidden' : hideOnMobile ? 'tablet:inline-flex hidden' : 'inline-flex'}`}
        >
          {label && `${label} `}
          <b className="text-gray-12 ml-1 tabular-nums">{value}</b>
        </span>
      ))}
      <span className="bg-orange-9 text-gray-white rounded-pill flex size-8 items-center justify-center text-xs font-extrabold">
        {memberName.slice(0, 1)}
      </span>
    </div>
  );
};

const StudentHeaderContent = ({
  initialMemberName,
}: Pick<DashboardAppHeaderProps, 'initialMemberName'>) => {
  const pathname = usePathname() ?? '';
  const storedMemberName = useMemberStore((state) => state.member?.name);
  const memberName = initialMemberName.trim() || storedMemberName || '학생';
  const showsSummary = !STUDENT_PATHS_WITHOUT_SUMMARY.some((pattern) =>
    pattern.test(pathname)
  );

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-gray-12 font-body1-heading">
          {studentAppBarTitle(pathname)}
        </h1>
        <p className="text-gray-9 font-caption-heading">
          {memberName} · 고2 수학
        </p>
      </div>
      {showsSummary ? (
        <StudentSummaryChips memberName={memberName} />
      ) : (
        <span className="bg-orange-9 text-gray-white rounded-pill flex size-8 items-center justify-center text-xs font-extrabold">
          {memberName.slice(0, 1)}
        </span>
      )}
    </div>
  );
};

const TeacherHeaderContent = ({
  initialMemberName,
}: Pick<DashboardAppHeaderProps, 'initialMemberName'>) => {
  const pathname = usePathname() ?? '';
  const storedMemberName = useMemberStore((state) => state.member?.name);
  const roomsQuery = useTeacherDashboardStudyRoomListQuery();
  const rooms = roomsQuery.data ?? [];
  const memberName = initialMemberName.trim() || storedMemberName || '선생님';
  const teacherName = memberName.endsWith('선생님')
    ? memberName
    : `${memberName} 선생님`;
  const studentCount = rooms.filter((room) => room.studentName).length;
  const todoCount = rooms.reduce((sum, room) => sum + room.todoCount, 0);
  const subtitle = /^\/study-rooms\/\d+(?:\/|$)/.test(pathname)
    ? '수업 상세 · 학생 화면 관리'
    : `스터디룸 ${rooms.length}개 · 학생 ${studentCount}명`;

  return (
    <div className="flex w-full min-w-0 flex-wrap items-center gap-3">
      <span className="bg-orange-9 text-gray-white rounded-pill flex size-8 shrink-0 items-center justify-center text-sm font-extrabold">
        {memberName.slice(0, 1)}
      </span>
      <div className="min-w-0 flex-1">
        <b className="text-gray-12 text-single-line block text-sm font-extrabold">
          {teacherName}
        </b>
        <small className="text-gray-9 text-ui-choice text-single-line block font-semibold">
          {subtitle}
        </small>
      </div>
      <div className="tablet:gap-5 ml-auto flex shrink-0 gap-3 text-right">
        <div>
          <small className="text-gray-9 text-ui-compact block font-bold">
            손볼 것 · 누르면 정렬
          </small>
          <b className="text-gray-12 block text-sm font-extrabold tabular-nums">
            {todoCount}건
          </b>
        </div>
        <div className="hidden sm:block">
          <small className="text-gray-9 text-ui-compact block font-bold">
            이번 주 사용
          </small>
          <b className="text-gray-12 block text-sm font-extrabold tabular-nums">
            0분{' '}
            <em className="text-gray-9 text-ui-choice font-bold not-italic">
              / 30분
            </em>
          </b>
        </div>
      </div>
    </div>
  );
};

const ParentHeaderContent = ({
  initialMemberName,
}: Pick<DashboardAppHeaderProps, 'initialMemberName'>) => {
  const memberName = initialMemberName.trim();
  const { data: parentReport, isPending } = useParentDashboardReportQuery();
  const stats: HeaderStat[] = [
    { value: parentReport?.studyNews ?? 0, unit: '개', label: '학습 소식' },
    {
      value: parentReport?.waitingInquiries ?? 0,
      unit: '건',
      label: '답변 대기',
    },
    {
      value: parentReport?.answeredInquiries ?? 0,
      unit: '건',
      label: '답변 완료',
    },
    {
      value: parentReport?.myStudentCount ?? 0,
      unit: '명',
      label: '매칭된 학생',
    },
  ];

  return (
    <div className="max-w-content mx-auto flex w-full flex-col gap-3">
      <div className="relative flex w-full items-end justify-between gap-4">
        <div className="tablet:min-h-50 desktop:min-h-55 flex min-h-25 min-w-0 flex-col justify-between gap-6">
          <p className="text-gray-12 font-body1-heading tablet:font-headline1-heading desktop:font-title-heading">
            {memberName ? <b>{memberName} 학부모님,</b> : <b>학부모님,</b>}
            <br />
            학습 여정을 함께 확인해보세요
          </p>
          <HeaderReport
            className="tablet:flex hidden"
            stats={stats}
            isPending={isPending}
          />
        </div>
        <Image
          src="/dashboard/dashboard-character.png"
          alt="대시보드 캐릭터"
          width={220}
          height={220}
          priority
          fetchPriority="high"
          sizes="(min-width: 1200px) 220px, (min-width: 768px) 200px, 100px"
          className="tablet:size-50 desktop:size-55 size-25 object-contain"
        />
      </div>
      <HeaderReport
        className="tablet:hidden flex"
        stats={stats}
        isPending={isPending}
      />
    </div>
  );
};

export const DashboardAppHeader = ({
  initialMemberName,
  role,
}: DashboardAppHeaderProps) => {
  if (role === 'ROLE_ADMIN' || role === 'ROLE_MEMBER') return null;

  return (
    <header
      data-dashboard-app-header
      data-dashboard-role={role}
      className={cn(
        'border-gray-3 bg-gray-white w-full border-b',
        role === 'ROLE_TEACHER' ? 'relative z-10' : 'sticky top-0 z-30',
        role === 'ROLE_PARENT'
          ? 'bg-system-background px-section-gap tablet:px-room-page-pad tablet:pt-19 pt-8 pb-3'
          : 'h-header-height shell:h-auto shell:min-h-header-height shell:py-appbar-pad-y px-appbar-pad-x flex shrink-0 items-center'
      )}
    >
      {role === 'ROLE_STUDENT' && (
        <StudentHeaderContent initialMemberName={initialMemberName} />
      )}
      {role === 'ROLE_TEACHER' && (
        <TeacherHeaderContent initialMemberName={initialMemberName} />
      )}
      {role === 'ROLE_PARENT' && (
        <ParentHeaderContent initialMemberName={initialMemberName} />
      )}
    </header>
  );
};
