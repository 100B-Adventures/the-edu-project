'use client';

import { useMemo, useState } from 'react';

import { useReceivedMessagesQuery } from '@/features/app-shell/hooks/use-shell-queries';
import { WeeklyRetroCard } from '@/features/dashboard/components/student/weekly-retro-card';
import {
  useStudentTodosQuery,
  useUpdateTodo,
} from '@/features/dashboard/hooks';
import { useDailyProblemsQuery } from '@/features/dashboard/hooks/use-wrong-answer-query';
import { useReviewOverviewQuery } from '@/features/review/hooks/use-review';
import { ActionCard } from '@/shared/components/action-card/action-card';
import { ScreenState } from '@/shared/components/screen-state';
import { StatChip } from '@/shared/components/ui/stat-chip';
import { isMvpHSliceEnabled } from '@/shared/lib/mvp-h-slice';

import { pickTodayAction } from '../model/pick-today-action';
import { ReceivedList } from './received-list';

/** 내 학습(오늘). 받은 것, 오늘 할 일 하나, 진행 숫자, 오늘 회고. 이번 주·연간 탭은 시간표(조각 2) 전까지 그리지 않는다. */
export const TodayPage = () => {
  const reviewEnabled = isMvpHSliceEnabled();
  const todosQuery = useStudentTodosQuery();
  const reviewQuery = useReviewOverviewQuery('curve', reviewEnabled);
  const problemsQuery = useDailyProblemsQuery();
  const messagesQuery = useReceivedMessagesQuery();
  const updateTodo = useUpdateTodo();
  const [pendingId, setPendingId] = useState<number | null>(null);

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
    </div>
  );
};
