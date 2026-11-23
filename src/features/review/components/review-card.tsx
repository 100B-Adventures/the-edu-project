'use client';

import Image from 'next/image';

import type { ReviewCard as ReviewCardData } from '@/entities/wrong-answer';
import { Button } from '@/shared/components/ui';
import { cn } from '@/shared/lib';

import { MAX_REVIEWS_FALLBACK, STUCK_REASON_LABEL } from '../review-labels';

type ReviewCardProps = {
  card: ReviewCardData;
  onOpen: (card: ReviewCardData) => void;
};

const DUE_BADGE_STYLE: Record<string, string> = {
  DUE_NOW: 'bg-orange-9 text-white',
  TOMORROW: 'border-orange-9 text-orange-10 border bg-white',
  DAY_AFTER: 'border-orange-9 text-orange-10 border bg-white',
  LATER: 'border-line-line2 text-text-sub1 border bg-white',
};

const reasonText = (card: ReviewCardData) =>
  card.reasonText ||
  card.reasons.map((code) => STUCK_REASON_LABEL[code] ?? code).join(' · ');

/** 시안 review.html `.pc` 카드: 썸네일 · 기한 배지 · 단원 · 제목 · 이유 · 회독 점 */
export const ReviewCard = ({ card, onOpen }: ReviewCardProps) => {
  const total = card.maxReviews || MAX_REVIEWS_FALLBACK;
  const reasons = reasonText(card);
  return (
    <Button
      variant="unstyled"
      onClick={() => onOpen(card)}
      data-testid="review-card"
      className="border-line-line1 rounded-card hover:border-orange-9 flex min-w-0 flex-col overflow-hidden border bg-white text-left"
    >
      <span className="bg-gray-1 relative block h-40 w-full overflow-hidden">
        {card.thumbUrl ? (
          <Image
            src={card.thumbUrl}
            alt=""
            fill
            unoptimized
            className="object-cover object-top-left"
          />
        ) : (
          <span className="font-headline1-heading text-gray-7 flex h-full items-center justify-center">
            {(card.title ?? '?').slice(0, 1)}
          </span>
        )}
        <span
          className={cn(
            'rounded-pill font-caption-heading absolute top-3 left-3 inline-flex min-h-badge-min items-center px-2.5',
            DUE_BADGE_STYLE[card.dueBadge.kind] ?? DUE_BADGE_STYLE.LATER
          )}
        >
          {card.dueBadge.label}
        </span>
      </span>
      <span className="flex min-w-0 flex-col gap-1 p-card-pad">
        {card.unitName && (
          <span className="font-caption-normal text-text-sub1 truncate">
            {card.unitName}
          </span>
        )}
        <span className="font-body1-heading text-text-main truncate">
          {card.title ?? '문제'}
        </span>
        {reasons && (
          <span className="font-caption-heading text-orange-10 bg-orange-1 rounded-button w-fit px-2 py-0.5">
            {reasons}
          </span>
        )}
        <span className="mt-1 flex items-center gap-1.5">
          {Array.from({ length: total }, (_, index) => (
            <span
              key={index}
              className={cn(
                'size-3 rounded-full',
                index < card.reviewCount ? 'bg-orange-9' : 'bg-gray-3'
              )}
            />
          ))}
          <span className="font-label-heading text-text-main ml-2">
            {card.reviewCount}/{total}회독
          </span>
        </span>
      </span>
    </Button>
  );
};
