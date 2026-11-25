import Image from 'next/image';
import Link from 'next/link';

import { StatusBadge } from '@/shared/components/ui/status-badge';
import { cn } from '@/shared/lib';

type NoteCardProps = {
  kind: 'concept' | 'solution' | 'free';
  title: string;
  thumbnailUrl?: string | null;
  pageCount?: number;
  /** 이미 '5월 3일' 처럼 읽을 수 있는 문자열로 받는다. 없으면 날짜 칸을 그리지 않는다. */
  updatedLabel?: string | null;
  href?: string;
  /** 쓴 칸이 아니면 점선 빈 칸. */
  slot?: 'filled' | 'empty';
  density?: 'cover' | 'row';
  className?: string;
};

const KIND_LABEL = { concept: '개념', solution: '풀이', free: '자유' } as const;

/** 노트 한 칸. 쓴 칸은 표지·쪽 수·갱신일, 안 쓴 칸은 점선(빈 단원을 질책하지 않는다, AC-53i). */
export const NoteCard = ({
  kind,
  title,
  thumbnailUrl,
  pageCount,
  updatedLabel,
  href,
  slot = 'filled',
  density = 'cover',
  className,
}: NoteCardProps) => {
  const body =
    slot === 'empty' ? (
      <div
        className={cn(
          'border-line-line2 rounded-card p-card-pad text-gray-8 font-caption-normal flex min-h-24 items-center justify-center border border-dashed text-center',
          className
        )}
      >
        {title}
      </div>
    ) : (
      <article
        className={cn(
          'border-line-line1 rounded-card border bg-white',
          density === 'cover'
            ? 'p-card-pad gap-content-gap flex flex-col'
            : 'px-card-pad py-content-gap gap-block-gap flex items-center',
          className
        )}
      >
        {thumbnailUrl && (
          <Image
            src={thumbnailUrl}
            alt=""
            width={density === 'cover' ? 240 : 56}
            height={density === 'cover' ? 160 : 56}
            unoptimized
            className="rounded-row bg-gray-1 aspect-[3/2] w-full object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-body2-heading text-text-main text-single-line">
            {title}
          </h3>
          <div className="gap-inline-gap font-caption-normal text-gray-9 flex flex-wrap items-center">
            <StatusBadge
              variant={kind === 'concept' ? 'primary' : 'default'}
              label={KIND_LABEL[kind]}
            />
            {pageCount !== undefined && <span>{pageCount}쪽</span>}
            {updatedLabel && <span>{updatedLabel}</span>}
          </div>
        </div>
      </article>
    );

  return href && slot === 'filled' ? <Link href={href}>{body}</Link> : body;
};
