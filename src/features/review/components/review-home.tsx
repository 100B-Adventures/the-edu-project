'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import {
  type ReviewCard as ReviewCardData,
  type ReviewCardsQuery,
  type ReviewView,
} from '@/entities/wrong-answer';
import { Skeleton } from '@/shared/components/loading';
import { Button, EmptyState, showBottomToast } from '@/shared/components/ui';
import { PRIVATE } from '@/shared/constants';
import { cn } from '@/shared/lib';
import { getApiError } from '@/shared/lib';
import { BookOpenText, ChartLine, LayoutGrid, Shuffle } from 'lucide-react';

import {
  useRandomProblemMutation,
  useReviewOverviewQuery,
} from '../hooks/use-review';
import { ReviewImportMenu } from './review-import-menu';
import {
  CardGrid,
  CurvePanel,
  type Filter,
  LevelBar,
  QuestSection,
  SituationPanel,
  UnitPanel,
} from './review-panels';
import { ReviewPreviewDialog } from './review-preview-dialog';

const VIEW_TABS: Array<{
  view: ReviewView;
  label: string;
  icon: typeof ChartLine;
}> = [
  { view: 'curve', label: '망각곡선', icon: ChartLine },
  { view: 'situation', label: '상황별', icon: LayoutGrid },
  { view: 'unit', label: '단원별', icon: BookOpenText },
];

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
      <div className="max-w-page-max p-card-pad mx-auto flex w-full flex-col gap-4">
        <Skeleton.Block className="h-16 w-full" />
        <Skeleton.Block className="h-48 w-full" />
        <Skeleton.Block className="h-40 w-full" />
      </div>
    );
  }
  if (overviewQuery.isError || !overviewQuery.data) {
    return (
      <div className="max-w-page-max p-card-pad mx-auto w-full">
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
    filter.kind === 'bucket'
      ? `${filter.intervalDays}일 지난 문제`
      : '지금 다시 풀 문제';

  return (
    <div className="max-w-page-max gap-section-gap p-card-pad mx-auto flex w-full flex-col pb-32">
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
                'min-h-touch-min rounded-button font-body2-heading gap-2 border px-4',
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
          onPick={(intervalDays) => setFilter({ kind: 'bucket', intervalDays })}
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
            overview.curve.soonForget.tomorrow +
            overview.curve.soonForget.dayAfter
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
      <div className="border-line-line1 bottom-control-xl fixed right-0 left-0 z-(--z-layer-chrome) flex items-center justify-end gap-3 border-t bg-white p-3 pb-[calc(var(--spacing-card-pad)+env(safe-area-inset-bottom))] lg:bottom-0 lg:left-(--spacing-sidebar-width)">
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
