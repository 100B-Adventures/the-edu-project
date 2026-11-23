'use client';

import Link from 'next/link';

import { Skeleton } from '@/shared/components/loading';
import { EmptyState } from '@/shared/components/ui';
import { PRIVATE } from '@/shared/constants';

import { NOTE_LABEL_TEXT, STUCK_REASON_LABEL } from '../../review/review-labels';
import { useStudentReviewSummaryQuery } from '../hooks/use-lesson';

type Props = { studentId: number };

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="border-line-line1 rounded-card flex flex-1 flex-col gap-1 border bg-white p-card-pad">
    <span className="font-label-normal text-text-sub1">{label}</span>
    <span className="font-headline1-heading text-text-main">{value}</span>
  </div>
);

/** 시안 t-student: 선생님이 보는 학생 N회독 현황 (slice 1 = review-summary 한 장) */
export const StudentReviewSummary = ({ studentId }: Props) => {
  const query = useStudentReviewSummaryQuery(studentId);
  if (query.isPending) return <Skeleton.Block className="h-60 w-full" />;
  if (query.isError || !query.data) {
    return <EmptyState title="학생 현황을 불러오지 못했어요" />;
  }
  const summary = query.data;
  const reasons = Object.entries(summary.reasonDistribution).sort(
    (a, b) => b[1] - a[1]
  );
  return (
    <div className="mx-auto flex w-full max-w-page-max flex-col gap-section-gap p-card-pad">
      <h1 className="font-headline1-heading text-text-main">학생 N회독</h1>
      <div className="flex flex-wrap gap-3">
        <Stat
          label="N회독 중"
          value={summary.activeCount}
        />
        <Stat
          label="지금 다시 풀 문제"
          value={summary.dueNow}
        />
        <Stat
          label="졸업"
          value={summary.graduatedCount}
        />
      </div>
      <section
        aria-label="막힌 곳"
        className="flex flex-wrap gap-2"
      >
        {reasons.map(([code, count]) => (
          <span
            key={code}
            className="rounded-pill font-caption-heading border-line-line2 min-h-badge-min inline-flex items-center border bg-white px-3"
          >
            {STUCK_REASON_LABEL[code] ?? code} {count}
          </span>
        ))}
      </section>
      <section
        aria-label="최근 풀이노트"
        className="flex flex-col gap-2"
      >
        <h2 className="font-headline2-heading text-text-main">최근 풀이노트</h2>
        {summary.recentNotes.length === 0 && (
          <p className="font-body2-normal text-text-sub1">풀이노트가 아직 없어요.</p>
        )}
        {summary.recentNotes.map((note) => (
          <Link
            key={note.solutionNoteId}
            href={PRIVATE.DASHBOARD.SOLUTION_NOTE(note.solutionNoteId)}
            className="border-line-line1 rounded-card hover:border-orange-9 flex min-h-touch-min flex-wrap items-center gap-2 border bg-white px-4 py-3"
          >
            <span className="font-body1-heading text-text-main truncate">
              {note.title ?? '풀이노트'}
            </span>
            {note.labels.map((label) => (
              <span
                key={label}
                className="font-caption-normal text-text-sub1"
              >
                {NOTE_LABEL_TEXT[label] ?? label}
              </span>
            ))}
          </Link>
        ))}
      </section>
    </div>
  );
};
