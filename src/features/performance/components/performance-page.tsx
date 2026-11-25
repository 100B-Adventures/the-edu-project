'use client';

import { useState } from 'react';

import Link from 'next/link';

import type { PeriodBlock } from '@/entities/shell';
import {
  useAppPolicyQuery,
  useGrowthPeriodsQuery,
} from '@/features/app-shell/hooks/use-shell-queries';
import { monthDayLabel } from '@/features/app-shell/model/format';
import { useWeeklyRetrospectQuery } from '@/features/dashboard/hooks/use-retrospect-query';
import { ScreenState } from '@/shared/components/screen-state';
import { SegmentedTabs } from '@/shared/components/ui/segmented-tabs';
import { StatChip } from '@/shared/components/ui/stat-chip';
import { PRIVATE } from '@/shared/constants';

import { ReflectionList } from './reflection-list';
import { WeeklyPagesChart } from './weekly-pages-chart';

const PERIODS = [
  { id: 'week', label: '주간' },
  { id: 'month', label: '월간' },
  { id: 'total', label: '전체' },
] as const;

type PeriodId = (typeof PERIODS)[number]['id'];

const isFirstDay = (block: PeriodBlock) =>
  block.pagesWritten + block.revisions + block.reviews + block.exp === 0;

/** 내 성과: 기간 탭 + 숫자 넷 + 주마다 쓴 쪽 + 이번 주 회고. 등수·비교·질책 문구가 없다(AC-47d·47k). */
export const PerformancePage = () => {
  const [period, setPeriod] = useState<PeriodId>('week');
  const periodsQuery = useGrowthPeriodsQuery();
  const policyQuery = useAppPolicyQuery();
  const retroQuery = useWeeklyRetrospectQuery();
  const block = periodsQuery.data?.[period];

  return (
    <div
      className="px-section-gap py-section-gap gap-block-gap mx-auto flex w-full max-w-280 flex-col"
      data-testid="performance-page"
    >
      <SegmentedTabs
        ariaLabel="기간"
        items={PERIODS.map(({ id, label }) => ({ id, label }))}
        value={period}
        onChange={(id) => setPeriod(id as PeriodId)}
      />
      <ScreenState
        status={
          periodsQuery.isError
            ? 'error'
            : periodsQuery.isPending
              ? 'loading'
              : 'ready'
        }
        error={{ onRetry: () => periodsQuery.refetch() }}
      >
        {block && (
          <>
            {isFirstDay(block) && (
              <p className="font-body2-normal text-gray-9">
                첫 노트를 올리면 여기에 쌓이기 시작해요.
              </p>
            )}
            <div className="gap-grid-gap tablet:grid-cols-4 grid grid-cols-2">
              <StatChip
                variant="tile"
                label="쓴 쪽"
                value={block.pagesWritten}
                unit="쪽"
              />
              <StatChip
                variant="tile"
                label="고친 수"
                value={block.revisions}
                unit="번"
              />
              <StatChip
                variant="tile"
                label="회독"
                value={block.reviews}
                unit="번"
              />
              <StatChip
                variant="tile"
                tone="brand"
                label="경험치"
                value={block.exp}
                sub={
                  period === 'total'
                    ? '오독공 활동 기준'
                    : policyQuery.data
                      ? `풀이 고치기 +${policyQuery.data.scoreTable.solutionReviseExp} EXP`
                      : undefined
                }
              />
            </div>
            <WeeklyPagesChart weeks={periodsQuery.data?.weeklyPages ?? []} />
          </>
        )}
      </ScreenState>
      <ReflectionList
        items={(retroQuery.data?.retrospects ?? []).map((item) => ({
          id: item.id,
          dateLabel: monthDayLabel(item.reflectDate),
          mood: item.mood,
          text: item.content,
        }))}
      />
      <Link
        href={PRIVATE.LEARNING.INDEX}
        className="font-body2-heading text-orange-11 min-h-touch-min inline-flex items-center"
      >
        개념 지도 보기
      </Link>
    </div>
  );
};
