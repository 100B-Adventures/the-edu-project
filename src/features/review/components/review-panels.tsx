'use client';

import Image from 'next/image';

import {
  type ReviewCard as ReviewCardData,
  type ReviewCardsQuery,
  type ReviewOverview,
} from '@/entities/wrong-answer';
import { useMyPointWalletQuery } from '@/features/point/hooks/use-point';
import { Skeleton } from '@/shared/components/loading';
import { Button, EmptyState } from '@/shared/components/ui';
import { cn } from '@/shared/lib';

import { useReviewCardsQuery } from '../hooks/use-review';
import { SITUATION_BUTTONS } from '../review-labels';
import { ReviewCard } from './review-card';

export type Filter =
  | { kind: 'all' }
  | { kind: 'bucket'; intervalDays: number }
  | { kind: 'reason'; key: string }
  | { kind: 'unit'; nodeId: number };

export const SECTION_BUTTON_BASE =
  'min-h-touch-min rounded-card border px-4 font-body2-heading';

const expRatio = (me: ReviewOverview['me']) => {
  const total = me.exp + me.expToNext;
  return total > 0 ? Math.round((me.exp / total) * 100) : 0;
};

export const LevelBar = ({ overview }: { overview: ReviewOverview }) => {
  const wallet = useMyPointWalletQuery();
  const ratio = expRatio(overview.me);
  return (
    <section
      aria-label="레벨"
      className="flex flex-wrap items-center gap-x-5 gap-y-3 lg:flex-nowrap"
    >
      <h1 className="font-headline1-heading text-text-main shrink-0">
        N회독
        <span className="font-label-normal text-text-sub1 ml-2.5">
          회독 {overview.reviewDay}일째
        </span>
      </h1>
      <div className="order-last w-full min-w-0 lg:order-none lg:w-auto lg:flex-1">
        <div className="font-body2-heading text-text-main flex justify-between">
          <span>
            Lv.{overview.me.level} · {overview.me.exp} EXP
          </span>
          <span className="text-text-sub1 font-body2-normal">
            Lv.{overview.me.level + 1}까지 {overview.me.expToNext} EXP
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="레벨 진행"
          aria-valuenow={ratio}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mt-2 flex h-3 gap-1"
        >
          {Array.from({ length: 10 }, (_, index) => (
            <span
              key={index}
              className={cn(
                'rounded-pill h-full flex-1',
                index < Math.round(ratio / 10) ? 'bg-orange-9' : 'bg-gray-2'
              )}
            />
          ))}
        </div>
      </div>
      <span className="border-orange-9 text-orange-10 font-headline2-heading rounded-card min-h-control-sm ml-auto flex items-center border-2 px-4">
        {(wallet.data?.balance ?? 0).toLocaleString('ko-KR')} P
      </span>
    </section>
  );
};

/** 오늘 퀘스트 카드의 문제 사진. 서버가 항목별 `thumbUrl` 을 준다(D-131). */
export const QuestThumb = ({ url }: { url: string | null | undefined }) => (
  <span
    className="border-line-line1 tablet:aspect-auto tablet:h-28 rounded-card bg-gray-1 relative block aspect-3/4 w-full overflow-hidden border"
    data-testid="quest-thumb"
  >
    {url && (
      <Image
        src={url}
        alt=""
        fill
        unoptimized
        className="object-contain"
      />
    )}
  </span>
);

export const QuestSection = ({
  quest,
  onOpen,
}: {
  quest: NonNullable<ReviewOverview['quest']>;
  onOpen: (wrongAnswerId: number) => void;
}) => (
  <section
    aria-label="오늘 퀘스트"
    className="border-orange-9 rounded-section p-card-pad border-2 bg-white"
  >
    <div className="mb-3 flex items-center gap-2.5">
      <h2 className="font-headline2-heading text-text-main">오늘 퀘스트</h2>
      <span className="font-body1-heading text-orange-10 ml-auto">
        +{quest.expReward} EXP
      </span>
    </div>
    {quest.items.length === 0 ? (
      <p className="font-body2-normal text-text-sub1">
        오늘 퀘스트가 비었어요.
      </p>
    ) : (
      <ul className="tablet:gap-3 grid grid-cols-3 gap-2">
        {quest.items.map((item) => {
          const done = item.solvedStatus === 'SOLVED';
          return (
            <li key={item.position}>
              <Button
                variant="unstyled"
                disabled={item.wrongAnswerId === null || done}
                onClick={() =>
                  item.wrongAnswerId !== null && onOpen(item.wrongAnswerId)
                }
                data-testid="review-quest-item"
                className="border-line-line1 rounded-card hover:border-orange-9 tablet:p-card-pad flex w-full flex-col items-start gap-2 border bg-white p-2 text-left disabled:opacity-60"
              >
                <QuestThumb url={item.thumbUrl} />
                <span className="font-body1-heading text-text-main line-clamp-2 w-full">
                  {item.title ?? item.unitTitle ?? '문제'}
                </span>
                <span className="font-body2-normal text-text-sub1 line-clamp-2">
                  {item.stuckReasonLabel ?? item.reason}
                </span>
                {item.dueLabel && (
                  <span className="font-body2-normal text-text-sub1 tablet:inline hidden">
                    {item.dueLabel}
                  </span>
                )}
                {item.expReward ? (
                  <span
                    className="font-label-heading text-orange-10 border-orange-9 rounded-pill tablet:px-3 border px-2 whitespace-nowrap"
                    data-testid="quest-item-exp"
                  >
                    +{item.expReward} EXP
                  </span>
                ) : null}
              </Button>
            </li>
          );
        })}
      </ul>
    )}
  </section>
);

export const CurvePanel = ({
  curve,
  filter,
  onPick,
}: {
  curve: NonNullable<ReviewOverview['curve']>;
  filter: Filter;
  onPick: (intervalDays: number) => void;
}) => (
  <section
    aria-label="망각곡선"
    className="border-line-line1 rounded-section p-card-pad border"
  >
    <div className="flex items-baseline">
      <h2 className="font-headline2-heading text-text-main">망각곡선</h2>
      <span className="font-body2-heading text-text-sub1 ml-auto">
        오늘 다시 풀 문제{' '}
        <b className="text-orange-10 font-headline2-heading">{curve.dueNow}</b>
      </span>
    </div>
    <svg
      viewBox="0 0 1000 150"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="mt-2 h-28 w-full"
    >
      <path
        d="M20 14 C120 70 220 100 400 118 S800 130 980 132"
        fill="none"
        className="stroke-orange-9"
        strokeWidth="3"
      />
      <line
        x1="20"
        y1="140"
        x2="980"
        y2="140"
        className="stroke-gray-4"
      />
    </svg>
    <div className="mt-2 flex flex-wrap gap-2">
      {curve.buckets.map((bucket) => {
        const on =
          filter.kind === 'bucket' &&
          filter.intervalDays === bucket.intervalDays;
        return (
          <Button
            key={bucket.intervalDays}
            variant="unstyled"
            onClick={() => onPick(bucket.intervalDays)}
            aria-pressed={on}
            data-testid="review-bucket"
            className={cn(
              'min-h-touch-min rounded-pill font-body2-heading border px-4',
              on
                ? 'border-orange-9 bg-orange-9 text-white'
                : 'border-line-line2 text-text-main bg-white'
            )}
          >
            {bucket.intervalDays}일 · {bucket.count}
          </Button>
        );
      })}
    </div>
  </section>
);

export const SituationPanel = ({
  situation,
  filter,
  onPick,
  onAll,
}: {
  situation: NonNullable<ReviewOverview['situation']>;
  filter: Filter;
  onPick: (key: string) => void;
  onAll: () => void;
}) => (
  <section
    aria-label="상황별"
    className="grid grid-cols-2 gap-3 lg:grid-cols-5"
  >
    <Button
      variant="unstyled"
      aria-pressed={filter.kind === 'all'}
      onClick={onAll}
      className={cn(
        SECTION_BUTTON_BASE,
        filter.kind === 'all'
          ? 'border-orange-9 bg-orange-1 text-orange-10 border-2'
          : 'border-line-line1 bg-white'
      )}
    >
      전체 <b className="text-orange-10">{situation.total}</b>
    </Button>
    {SITUATION_BUTTONS.map((item) => {
      const on = filter.kind === 'reason' && filter.key === item.key;
      return (
        <Button
          key={item.key}
          variant="unstyled"
          aria-pressed={on}
          onClick={() => onPick(item.key)}
          data-testid="review-situation"
          className={cn(
            SECTION_BUTTON_BASE,
            on
              ? 'border-orange-9 bg-orange-1 text-orange-10 border-2'
              : 'border-line-line1 bg-white'
          )}
        >
          {item.label}{' '}
          <b className="text-orange-10">{situation.byReason[item.key] ?? 0}</b>
        </Button>
      );
    })}
  </section>
);

export const UnitPanel = ({
  units,
  filter,
  onPick,
}: {
  units: NonNullable<ReviewOverview['unit']>;
  filter: Filter;
  onPick: (nodeId: number) => void;
}) => (
  <section
    aria-label="단원별"
    className="grid gap-3 lg:grid-cols-3"
  >
    {units.map((unit) => {
      const nodeId = unit.treeNodeId;
      const on = filter.kind === 'unit' && filter.nodeId === nodeId;
      return (
        <Button
          key={unit.treeNodeId ?? unit.name}
          variant="unstyled"
          disabled={nodeId === null}
          aria-pressed={on}
          onClick={() => nodeId !== null && onPick(nodeId)}
          data-testid="review-unit"
          className={cn(
            SECTION_BUTTON_BASE,
            'flex items-center justify-between py-3',
            on
              ? 'border-orange-9 bg-orange-1 border-2'
              : 'border-line-line1 bg-white'
          )}
        >
          <span className="truncate">{unit.name}</span>
          <span className="text-orange-10">
            {unit.count}
            {unit.dueNow > 0 && ` · 지금 ${unit.dueNow}`}
          </span>
        </Button>
      );
    })}
  </section>
);

export const CardGrid = ({
  title,
  count,
  query,
  onOpen,
  extra,
}: {
  title: string;
  count?: number;
  query: ReviewCardsQuery;
  onOpen: (card: ReviewCardData) => void;
  extra?: React.ReactNode;
}) => {
  const cardsQuery = useReviewCardsQuery(query);
  const items = cardsQuery.data?.items ?? [];
  return (
    <section>
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="font-headline2-heading text-text-main">{title}</h2>
        <span className="text-orange-10 font-headline2-heading">
          {count ?? cardsQuery.data?.totalCount ?? 0}
        </span>
        {extra}
      </div>
      {cardsQuery.isPending ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton.Block className="h-60 w-full" />
          <Skeleton.Block className="h-60 w-full" />
          <Skeleton.Block className="h-60 w-full" />
        </div>
      ) : cardsQuery.isError ? (
        <EmptyState
          title="문제를 불러오지 못했어요"
          action={
            <Button
              variant="outlined"
              onClick={() => void cardsQuery.refetch()}
            >
              다시 시도
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState title="여기에 맞는 문제가 없어요" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {items.map((card) => (
            <ReviewCard
              key={card.wrongAnswerId}
              card={card}
              onOpen={onOpen}
            />
          ))}
        </div>
      )}
    </section>
  );
};
