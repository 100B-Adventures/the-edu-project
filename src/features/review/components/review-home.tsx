'use client';

import { useState } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import {
  type ReviewCard as ReviewCardData,
  type ReviewCardsQuery,
  type ReviewOverview,
  type ReviewView,
} from '@/entities/wrong-answer';
import { useMyPointWalletQuery } from '@/features/point/hooks/use-point';
import { Skeleton } from '@/shared/components/loading';
import { Button, EmptyState, showBottomToast } from '@/shared/components/ui';
import { PRIVATE } from '@/shared/constants';
import { cn } from '@/shared/lib';
import { getApiError } from '@/shared/lib';
import { BookOpenText, ChartLine, LayoutGrid, Shuffle } from 'lucide-react';

import {
  useRandomProblemMutation,
  useReviewCardsQuery,
  useReviewOverviewQuery,
} from '../hooks/use-review';
import { SITUATION_BUTTONS } from '../review-labels';
import { ReviewCard } from './review-card';
import { ReviewImportMenu } from './review-import-menu';
import { ReviewPreviewDialog } from './review-preview-dialog';

type Filter =
  | { kind: 'all' }
  | { kind: 'bucket'; intervalDays: number }
  | { kind: 'reason'; key: string }
  | { kind: 'unit'; nodeId: number };

const VIEW_TABS: Array<{
  view: ReviewView;
  label: string;
  icon: typeof ChartLine;
}> = [
  { view: 'curve', label: '망각곡선', icon: ChartLine },
  { view: 'situation', label: '상황별', icon: LayoutGrid },
  { view: 'unit', label: '단원별', icon: BookOpenText },
];

const SECTION_BUTTON_BASE =
  'min-h-touch-min rounded-card border px-4 font-body2-heading';

const toCardsQuery = (view: ReviewView, filter: Filter): ReviewCardsQuery => {
  if (view === 'curve' && filter.kind === 'bucket') {
    return { view: 'curve', bucket: filter.intervalDays };
  }
  if (view === 'situation' && filter.kind === 'reason') {
    return { view: 'situation', reason: filter.key };
  }
  if (view === 'unit' && filter.kind === 'unit') {
    return { view: 'unit', nodeId: filter.nodeId };
  }
  return { view: 'curve' };
};

const expRatio = (me: ReviewOverview['me']) => {
  const total = me.exp + me.expToNext;
  return total > 0 ? Math.round((me.exp / total) * 100) : 0;
};

const LevelBar = ({ overview }: { overview: ReviewOverview }) => {
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
      <span className="border-orange-9 text-orange-10 font-headline2-heading rounded-card ml-auto flex min-h-control-sm items-center border-2 px-4">
        {(wallet.data?.balance ?? 0).toLocaleString('ko-KR')} P
      </span>
    </section>
  );
};

/** 오늘 퀘스트 카드의 문제 사진. 서버가 항목별 `thumbUrl` 을 준다(D-131). */
const QuestThumb = ({ url }: { url: string | null | undefined }) => (
  <span
    className="border-line-line1 relative block aspect-3/4 w-full overflow-hidden wide-phone:aspect-auto wide-phone:h-28 rounded-card border bg-gray-1"
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

const QuestSection = ({
  quest,
  onOpen,
}: {
  quest: NonNullable<ReviewOverview['quest']>;
  onOpen: (wrongAnswerId: number) => void;
}) => (
  <section
    aria-label="오늘 퀘스트"
    className="border-orange-9 rounded-section border-2 bg-white p-card-pad"
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
      <ul className="grid grid-cols-3 gap-2 wide-phone:gap-3">
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
                className="border-line-line1 rounded-card hover:border-orange-9 flex w-full flex-col items-start gap-2 border bg-white p-2 text-left wide-phone:p-card-pad disabled:opacity-60"
              >
                <QuestThumb url={item.thumbUrl} />
                <span className="font-body1-heading text-text-main line-clamp-2 w-full">
                  {item.title ?? item.unitTitle ?? '문제'}
                </span>
                <span className="font-body2-normal text-text-sub1 line-clamp-2">
                  {item.stuckReasonLabel ?? item.reason}
                </span>
                {item.dueLabel && (
                  <span className="font-body2-normal text-text-sub1 hidden wide-phone:inline">
                    {item.dueLabel}
                  </span>
                )}
                {item.expReward ? (
                  <span
                    className="font-label-heading text-orange-10 border-orange-9 rounded-pill border px-2 whitespace-nowrap wide-phone:px-3"
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

const CurvePanel = ({
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
    className="border-line-line1 rounded-section border p-card-pad"
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
          filter.kind === 'bucket' && filter.intervalDays === bucket.intervalDays;
        return (
          <Button
            key={bucket.intervalDays}
            variant="unstyled"
            onClick={() => onPick(bucket.intervalDays)}
            aria-pressed={on}
            data-testid="review-bucket"
            className={cn(
              'min-h-touch-min rounded-pill border px-4 font-body2-heading',
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

const SituationPanel = ({
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
          <b className="text-orange-10">
            {situation.byReason[item.key] ?? 0}
          </b>
        </Button>
      );
    })}
  </section>
);

const UnitPanel = ({
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

const CardGrid = ({
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

export const ReviewHome = () => {
  const router = useRouter();
  const [view, setView] = useState<ReviewView>('curve');
  const [filter, setFilter] = useState<Filter>({ kind: 'all' });
  const [preview, setPreview] = useState<ReviewCardData | null>(null);
  const overviewQuery = useReviewOverviewQuery(view);
  const randomMutation = useRandomProblemMutation();

  const openBlank = (wrongAnswerId: number) =>
    router.push(PRIVATE.DASHBOARD.STUDENT_REVIEW_BLANK(wrongAnswerId));

  const switchView = (next: ReviewView) => {
    setView(next);
    setFilter({ kind: 'all' });
  };

  const handleRandom = async () => {
    try {
      const picked = await randomMutation.mutateAsync();
      openBlank(picked.wrongAnswerId);
    } catch (error) {
      if (getApiError(error)?.code === 'NO_REVIEWABLE_PROBLEM') {
        showBottomToast('오늘 다시 풀 문제가 없어요.');
        return;
      }
      showBottomToast('무작위 문제를 고르지 못했어요.');
    }
  };

  if (overviewQuery.isPending) {
    return (
      <div className="mx-auto flex w-full max-w-page-max flex-col gap-4 p-card-pad">
        <Skeleton.Block className="h-16 w-full" />
        <Skeleton.Block className="h-48 w-full" />
        <Skeleton.Block className="h-40 w-full" />
      </div>
    );
  }
  if (overviewQuery.isError || !overviewQuery.data) {
    return (
      <div className="mx-auto w-full max-w-page-max p-card-pad">
        <EmptyState
          title="N회독을 불러오지 못했어요"
          action={
            <Button
              variant="outlined"
              onClick={() => void overviewQuery.refetch()}
            >
              다시 시도
            </Button>
          }
        />
      </div>
    );
  }

  const overview = overviewQuery.data;
  const cardsQuery = toCardsQuery(view, filter);
  const cardsTitle =
    filter.kind === 'bucket' ? `${filter.intervalDays}일 지난 문제` : '지금 다시 풀 문제';

  return (
    <div className="mx-auto flex w-full max-w-page-max flex-col gap-section-gap p-card-pad pb-32">
      <LevelBar overview={overview} />
      {overview.quest && (
        <QuestSection
          quest={overview.quest}
          onOpen={openBlank}
        />
      )}
      <div
        role="tablist"
        aria-label="보기 전환"
        className="flex flex-wrap items-center gap-2"
      >
        {VIEW_TABS.map((tab) => {
          const Icon = tab.icon;
          const on = view === tab.view;
          return (
            <Button
              key={tab.view}
              variant="unstyled"
              role="tab"
              aria-selected={on}
              onClick={() => switchView(tab.view)}
              data-testid={`review-tab-${tab.view}`}
              className={cn(
                'min-h-touch-min rounded-button gap-2 border px-4 font-body2-heading',
                on
                  ? 'border-gray-12 bg-gray-12 text-white'
                  : 'border-line-line2 bg-white'
              )}
            >
              <Icon
                size={18}
                aria-hidden="true"
              />
              {tab.label}
            </Button>
          );
        })}
        <ReviewImportMenu />
      </div>
      {view === 'curve' && overview.curve && (
        <CurvePanel
          curve={overview.curve}
          filter={filter}
          onPick={(intervalDays) =>
            setFilter({ kind: 'bucket', intervalDays })
          }
        />
      )}
      {view === 'situation' && overview.situation && (
        <SituationPanel
          situation={overview.situation}
          filter={filter}
          onPick={(key) => setFilter({ kind: 'reason', key })}
          onAll={() => setFilter({ kind: 'all' })}
        />
      )}
      {view === 'unit' && overview.unit && (
        <UnitPanel
          units={overview.unit}
          filter={filter}
          onPick={(nodeId) => setFilter({ kind: 'unit', nodeId })}
        />
      )}
      <CardGrid
        title={cardsTitle}
        query={cardsQuery}
        onOpen={setPreview}
      />
      {view === 'curve' && filter.kind === 'all' && overview.curve && (
        <CardGrid
          title="곧 잊을 문제"
          count={
            overview.curve.soonForget.tomorrow + overview.curve.soonForget.dayAfter
          }
          query={{ view: 'soon', within: 2 }}
          onOpen={setPreview}
          extra={
            <span className="ml-auto flex gap-2">
              <span className="border-line-line2 rounded-pill font-caption-heading border px-3 py-1">
                내일 {overview.curve.soonForget.tomorrow}
              </span>
              <span className="border-line-line2 rounded-pill font-caption-heading border px-3 py-1">
                모레 {overview.curve.soonForget.dayAfter}
              </span>
            </span>
          }
        />
      )}
      <div className="border-line-line1 fixed right-0 bottom-control-xl left-0 z-(--z-layer-chrome) lg:bottom-0 flex items-center justify-end gap-3 border-t bg-white p-3 pb-[calc(var(--spacing-card-pad)+env(safe-area-inset-bottom))] lg:left-(--spacing-sidebar-width)">
        <Button
          size="large"
          className="gap-2"
          isLoading={randomMutation.isPending}
          onClick={() => void handleRandom()}
          data-testid="review-random"
        >
          <Shuffle
            size={20}
            aria-hidden="true"
          />
          무작위 한 문제
        </Button>
      </div>
      <ReviewPreviewDialog
        card={preview}
        onClose={() => setPreview(null)}
      />
    </div>
  );
};
