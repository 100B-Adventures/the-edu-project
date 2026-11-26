'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { useReceivedMessagesQuery } from '@/features/app-shell/hooks/use-shell-queries';
import { SHELL_CAPABILITIES } from '@/features/app-shell/model/shell-capabilities';
import { WeeklyRetroCard } from '@/features/dashboard/components/student/weekly-retro-card';
import {
  useStudentTodosQuery,
  useUpdateTodo,
} from '@/features/dashboard/hooks';
import { useDailyProblemsQuery } from '@/features/dashboard/hooks/use-wrong-answer-query';
import { useReviewOverviewQuery } from '@/features/review/hooks/use-review';
import { WeekSchedule } from '@/features/schedule/components/week-schedule';
import { YearSchedule } from '@/features/schedule/components/year-schedule';
import { useScheduleQuery } from '@/features/schedule/hooks/use-schedule';
import { ActionCard } from '@/shared/components/action-card/action-card';
import { ScreenState } from '@/shared/components/screen-state';
import { SegmentedTabs } from '@/shared/components/ui/segmented-tabs';
import { StatChip } from '@/shared/components/ui/stat-chip';
import { isMvpHSliceEnabled } from '@/shared/lib/mvp-h-slice';

import { pickTodayAction } from '../model/pick-today-action';
import { ReceivedList } from './received-list';

type TodayTab = 'today' | 'week' | 'year';

/** 내 학습의 오늘·이번 주·연간을 같은 주소에서 전환한다. */
export const TodayPage = () => {
  const reviewEnabled = isMvpHSliceEnabled();
  const todosQuery = useStudentTodosQuery();
  const reviewQuery = useReviewOverviewQuery('curve', reviewEnabled);
  const problemsQuery = useDailyProblemsQuery();
  const messagesQuery = useReceivedMessagesQuery();
  const updateTodo = useUpdateTodo();
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [tab, setTab] = useState<TodayTab>('today');
  const defaultApplied = useRef(false);
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const defaultScopeQuery = useScheduleQuery(today, today);

  useEffect(() => {
    if (defaultApplied.current || !defaultScopeQuery.data) return;
    defaultApplied.current = true;
    const kind = defaultScopeQuery.data.defaultScope.kind;
    setTab(kind === 'WEEK' ? 'week' : kind === 'GOAL' ? 'year' : 'today');
  }, [defaultScopeQuery.data]);

  const action = useMemo(
    () =>
      pickTodayAction({
        todos: todosQuery.data?.items ?? [],
        reviewEnabled,
        reviewDueCount: reviewQuery.data?.curve?.dueNow ?? 0,
        firstProblem: problemsQuery.data?.items[0] ?? null,
      }),
    [todosQuery.data, reviewEnabled, reviewQuery.data, problemsQuery.data]
  );

  const status = todosQuery.isError
    ? 'error'
    : todosQuery.isPending
      ? 'loading'
      : 'ready';
  const total = todosQuery.data?.totalCount ?? 0;
  const done = todosQuery.data?.doneCount ?? 0;

  return (
    <div
      className="px-section-gap py-section-gap gap-block-gap mx-auto flex w-full max-w-280 flex-col"
      data-testid="today-page"
    >
      {SHELL_CAPABILITIES.schedule && (
        <SegmentedTabs
          ariaLabel="학습 기간"
          variant="underline"
          items={[
            { id: 'today', label: '오늘' },
            { id: 'week', label: '이번 주' },
            { id: 'year', label: '연간' },
          ]}
          value={tab}
          onChange={(id) => setTab(id as TodayTab)}
        />
      )}
      {tab === 'today' && (
        <>
          <ReceivedList items={messagesQuery.data ?? []} />
          <ScreenState
            status={status}
            error={{ onRetry: () => todosQuery.refetch() }}
          >
            <ActionCard
              eyebrow="오늘 할 일 하나"
              title={action.title}
              subtitle={action.subtitle}
              cta={{
                label: action.cta.label,
                href: action.cta.href,
                disabled: pendingId !== null,
                onClick:
                  action.cta.todoId === undefined
                    ? undefined
                    : () => {
                        const id = action.cta.todoId as number;
                        setPendingId(id);
                        updateTodo.mutate(
                          { id, input: { status: 'DONE' } },
                          { onSettled: () => setPendingId(null) }
                        );
                      },
              }}
            />
            {total > 0 && (
              <div className="gap-content-gap flex flex-wrap">
                <StatChip
                  label="이번 주 할 일"
                  value={`${done}/${total}`}
                  tone="brand"
                />
              </div>
            )}
          </ScreenState>
          <WeeklyRetroCard />
        </>
      )}
      {tab === 'week' && <WeekSchedule />}
      {tab === 'year' && <YearSchedule />}
    </div>
  );
};
