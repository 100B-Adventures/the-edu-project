import Link from 'next/link';

import { cn } from '@/shared/lib';

type RoomCardProps = {
  name: string;
  teacherName?: string | null;
  memberCounts?: { teacher: number; student: number };
  noteCount?: number;
  lectureCount?: number;
  href?: string;
  selected?: boolean;
  variant?: 'office' | 'chip' | 'row';
  className?: string;
};

/** 방 카드. office = 교무실 머리 카드, chip = 방 전환 칩, row = 진입 줄. */
export const RoomCard = ({
  name,
  teacherName,
  memberCounts,
  noteCount,
  lectureCount,
  href,
  selected = false,
  variant = 'office',
  className,
}: RoomCardProps) => {
  if (variant === 'chip') {
    const chip = cn(
      'min-h-chip-min px-button-chip-x rounded-pill font-caption-heading inline-flex items-center border',
      selected
        ? 'border-orange-3 bg-orange-1 text-orange-11'
        : 'border-line-line1 text-gray-9 bg-white',
      className
    );
    return href ? (
      <Link
        href={href}
        className={chip}
        aria-current={selected ? 'page' : undefined}
      >
        {name}
      </Link>
    ) : (
      <span className={chip}>{name}</span>
    );
  }

  const stats = [
    memberCounts
      ? `선생님 ${memberCounts.teacher} · 학생 ${memberCounts.student}`
      : null,
    noteCount !== undefined ? `노트 ${noteCount}` : null,
    lectureCount !== undefined ? `강의 ${lectureCount}` : null,
  ].filter(Boolean);

  const card = (
    <section
      className={cn(
        'border-line-line1 rounded-card p-card-pad gap-content-gap flex flex-col border bg-white',
        variant === 'row' && 'flex-row items-center justify-between',
        className
      )}
    >
      <div className="min-w-0">
        <h2 className="font-headline2-heading text-text-main text-heading-wrap">
          {name}
        </h2>
        {teacherName && (
          <p className="font-body2-normal text-gray-9">{teacherName} 선생님</p>
        )}
      </div>
      {stats.length > 0 && (
        <p className="font-caption-normal text-gray-9 numeric-tabular">
          {stats.join('  ·  ')}
        </p>
      )}
    </section>
  );
  return href ? <Link href={href}>{card}</Link> : card;
};
