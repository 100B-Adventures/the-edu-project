'use client';

import Link from 'next/link';

import type { StudentOverview } from '@/entities/shell';
import { useStudentOverviewQuery } from '@/features/app-shell/hooks/use-shell-queries';
import { monthDayLabel } from '@/features/app-shell/model/format';
import { ScreenState } from '@/shared/components/screen-state';
import { StatChip } from '@/shared/components/ui/stat-chip';
import { StatusBadge } from '@/shared/components/ui/status-badge';
import { PRIVATE } from '@/shared/constants';

import { StudentReviewSummary } from '../student-review-summary';
import { QuickMessage } from './quick-message';

type StudentDetailPageProps = { studentId: number; roomId?: number };

const SummaryChips = ({ counts }: { counts: StudentOverview['counts'] }) => (
  <div className="gap-content-gap flex flex-wrap">
    <StatChip
      label="개념노트"
      value={counts.conceptNotes}
      tone="brand"
    />
    <StatChip
      label="풀이"
      value={counts.solutions}
    />
    <StatChip
      label="질문"
      value={counts.questions}
    />
    {/* 못 한 날은 58일 일정이 있어야 의미가 있어 값이 오면 그린다(조각 3). */}
    {counts.missedDays !== null && (
      <StatChip
        label="못 한 날"
        value={counts.missedDays}
      />
    )}
  </div>
);

const Activity14d = ({ days }: { days: StudentOverview['activity14d'] }) => {
  const max = Math.max(...days.map((day) => day.studyMinutes), 1);
  return (
    <section
      aria-label="최근 2주"
      className="border-line-line1 rounded-card p-card-pad gap-block-gap flex flex-col border bg-white"
    >
      <h2 className="font-body2-heading text-text-main">최근 2주</h2>
      <ol className="gap-inline-gap-xs flex h-24 items-end">
        {days.map((day) => {
          const height = Math.round((day.studyMinutes / max) * 100);
          return (
            <li
              key={day.date}
              className="flex h-full min-w-0 flex-1 items-end"
              title={`${monthDayLabel(day.date)} ${day.studyMinutes}분`}
            >
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
                className="h-full w-full"
              >
                <rect
                  x="0"
                  y={100 - height}
                  width="100"
                  height={height}
                  rx="4"
                  className="fill-orange-5"
                />
              </svg>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

const NoteUpdate = ({ week }: { week: StudentOverview['noteWeek'] }) => (
  <div className="gap-grid-gap tablet:grid-cols-3 grid grid-cols-2">
    <StatChip
      variant="tile"
      label="이번 주 쪽"
      value={week.pages}
      unit="쪽"
    />
    <StatChip
      variant="tile"
      label="지난주와 차이"
      value={week.deltaPages > 0 ? `+${week.deltaPages}` : week.deltaPages}
      unit="쪽"
    />
    {week.avgSolveMinutes !== null && (
      <StatChip
        variant="tile"
        label="평균 풀이 시간"
        value={week.avgSolveMinutes}
        unit="분"
      />
    )}
    {week.pinFixedRate !== null && (
      <StatChip
        variant="tile"
        label="핀 고친 비율"
        value={week.pinFixedRate}
        unit="%"
      />
    )}
  </div>
);

const RecentNotes = ({
  studentId,
  notes,
}: {
  studentId: number;
  notes: StudentOverview['recentNotes'];
}) => {
  if (notes.length === 0) return null;
  return (
    <section
      aria-label="최근 노트"
      className="gap-content-gap flex flex-col"
    >
      <h2 className="font-body2-heading text-text-main">최근 노트</h2>
      <ul className="gap-row-gap flex flex-col">
        {notes.map((note) => (
          <li key={note.noteId}>
            <Link
              href={`/dashboard/teacher/students/${studentId}/notes/${note.nodeId}`}
              className="border-line-line1 rounded-row px-card-pad py-content-gap gap-block-gap flex items-center justify-between border bg-white"
            >
              <span className="font-body2-normal text-text-main text-single-line">
                {note.title}
              </span>
              <span className="gap-inline-gap flex shrink-0 items-center">
                {note.unconfirmed && (
                  <StatusBadge
                    variant="primary"
                    label="확인 전"
                  />
                )}
                <span className="font-caption-normal text-gray-8">
                  {monthDayLabel(note.at)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};

const StuckList = ({ items }: { items: StudentOverview['stuck'] }) => {
  if (items.length === 0) return null;
  return (
    <section
      aria-label="막힌 곳"
      className="gap-content-gap flex flex-col"
    >
      <h2 className="font-body2-heading text-text-main">막힌 곳</h2>
      <ul className="gap-row-gap flex flex-col">
        {items.map((item, index) => (
          <li
            key={`${item.kind}-${item.at}-${index}`}
            className="border-line-line1 rounded-row px-card-pad py-content-gap border bg-white"
          >
            <p className="font-body2-normal text-text-main text-single-line">
              {item.title}
            </p>
            {item.detail && (
              <p className="font-caption-normal text-gray-9 text-two-lines">
                {item.detail}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};

/** 선생님이 보는 학생 상세. 요약 칩, 최근 2주, 노트 업데이트, 최근 노트, 막힌 곳, 빠른 피드백 순서. 순위·점수순은 없다(AC-36b). */
export const StudentDetailPage = ({
  studentId,
  roomId,
}: StudentDetailPageProps) => {
  const query = useStudentOverviewQuery(studentId, roomId);
  const overview = query.data;
  const forbidden =
    (query.error as { response?: { status?: number } } | null)?.response
      ?.status === 403;
  const feedbackRoomId = roomId ?? overview?.roomId;

  return (
    <div
      className="px-section-gap py-section-gap gap-block-gap mx-auto flex w-full max-w-280 flex-col"
      data-testid="student-detail-page"
    >
      <ScreenState
        status={
          forbidden
            ? 'forbidden'
            : query.isError
              ? 'error'
              : query.isPending
                ? 'loading'
                : 'ready'
        }
        error={{ onRetry: () => query.refetch() }}
        forbidden={{ title: '같은 방 학생만 볼 수 있어요' }}
      >
        {overview && (
          <>
            <h2 className="font-headline2-heading text-text-main">
              {overview.profile.name}
              {overview.profile.schoolLabel && (
                <span className="font-body2-normal text-gray-9 ml-2">
                  {overview.profile.schoolLabel}
                </span>
              )}
            </h2>
            <SummaryChips counts={overview.counts} />
            <Activity14d days={overview.activity14d} />
            <NoteUpdate week={overview.noteWeek} />
            <RecentNotes
              studentId={studentId}
              notes={overview.recentNotes}
            />
            <StuckList items={overview.stuck} />
            {feedbackRoomId ? (
              <QuickMessage
                studentId={studentId}
                roomId={feedbackRoomId}
              />
            ) : null}
            <StudentReviewSummary studentId={studentId} />
          </>
        )}
      </ScreenState>
      <Link
        href={PRIVATE.DASHBOARD.TEACHER}
        className="font-body2-heading text-orange-11 min-h-touch-min inline-flex items-center"
      >
        학생 현황으로
      </Link>
    </div>
  );
};
