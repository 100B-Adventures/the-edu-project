'use client';

import { useMemo, useState } from 'react';

import type { BlockInput } from '@/features/schedule/api/schedule-api';
import {
  useScheduleMutations,
  useScheduleQuery,
} from '@/features/schedule/hooks/use-schedule';
import { assignOverlapColumns } from '@/features/schedule/model/overlap-layout';
import { ScreenState } from '@/shared/components/screen-state';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

const toDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const mondayOf = (date: Date) => {
  const copy = new Date(date);
  const day = copy.getDay() || 7;
  copy.setDate(copy.getDate() - day + 1);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const minuteLabel = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(
    minute % 60
  ).padStart(2, '0')}`;

const TRACK_LABEL = { TEACHER: '선생님', ACADEMY: '학원', SELF: '혼자' };

export const WeekSchedule = () => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [adding, setAdding] = useState(false);
  const start = mondayOf(new Date());
  start.setDate(start.getDate() + weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
  const from = toDate(days[0] as Date);
  const to = toDate(days[6] as Date);
  const query = useScheduleQuery(from, to);
  const mutations = useScheduleMutations();
  const [draft, setDraft] = useState<BlockInput>({
    date: from,
    startMin: 1080,
    endMin: 1140,
    track: 'SELF',
    title: '',
    todoId: null,
    treeNodeId: null,
  });

  const byDay = useMemo(
    () =>
      Object.fromEntries(
        days.map((date) => {
          const key = toDate(date);
          return [
            key,
            assignOverlapColumns(
              (query.data?.blocks ?? []).filter((block) => block.date === key)
            ),
          ];
        })
      ),
    [days, query.data]
  );

  const save = () => {
    if (!draft.title.trim()) return;
    mutations.create.mutate(
      { ...draft, date: draft.date || from, title: draft.title.trim() },
      {
        onSuccess: () => {
          setAdding(false);
          setDraft((current) => ({ ...current, title: '' }));
        },
      }
    );
  };

  return (
    <section
      className="gap-block-gap flex flex-col"
      aria-label="이번 주 시간표"
    >
      <div className="gap-content-gap flex flex-wrap items-center justify-between">
        <div className="gap-inline-gap flex items-center">
          <Button
            variant="ghost"
            onClick={() => setWeekOffset((value) => value - 1)}
          >
            이전 주
          </Button>
          <strong className="font-body1-heading text-gray-12">
            {from} ~ {to}
          </strong>
          <Button
            variant="ghost"
            onClick={() => setWeekOffset((value) => value + 1)}
          >
            다음 주
          </Button>
        </div>
        <Button onClick={() => setAdding((value) => !value)}>블록 추가</Button>
      </div>

      {adding && (
        <div className="border-line-line1 rounded-card p-card-pad gap-content-gap shell:grid-cols-4 grid border bg-white">
          <label className="font-body2-heading text-gray-11">
            날짜
            <Input
              type="date"
              value={draft.date}
              onChange={(event) =>
                setDraft({ ...draft, date: event.target.value })
              }
            />
          </label>
          <label className="font-body2-heading text-gray-11">
            시작
            <Input
              type="time"
              value={minuteLabel(draft.startMin)}
              onChange={(event) => {
                const [hour = 0, minute = 0] = event.target.value
                  .split(':')
                  .map(Number);
                setDraft({ ...draft, startMin: hour * 60 + minute });
              }}
            />
          </label>
          <label className="font-body2-heading text-gray-11">
            끝
            <Input
              type="time"
              value={minuteLabel(draft.endMin)}
              onChange={(event) => {
                const [hour = 0, minute = 0] = event.target.value
                  .split(':')
                  .map(Number);
                setDraft({ ...draft, endMin: hour * 60 + minute });
              }}
            />
          </label>
          <label className="font-body2-heading text-gray-11">
            할 일
            <Input
              value={draft.title}
              onChange={(event) =>
                setDraft({ ...draft, title: event.target.value })
              }
              placeholder="예: 수학 오답 3문제"
            />
          </label>
          <div className="gap-inline-gap shell:col-span-4 flex">
            {(['TEACHER', 'ACADEMY', 'SELF'] as const).map((track) => (
              <Button
                key={track}
                type="button"
                variant={draft.track === track ? 'primary' : 'outlined'}
                onClick={() => setDraft({ ...draft, track })}
              >
                {TRACK_LABEL[track]}
              </Button>
            ))}
            <Button
              onClick={save}
              disabled={mutations.create.isPending}
            >
              저장
            </Button>
          </div>
        </div>
      )}

      <ScreenState
        status={query.isPending ? 'loading' : query.isError ? 'error' : 'ready'}
        error={{ onRetry: () => query.refetch() }}
      >
        <div
          className="max-w-full overflow-x-auto"
          data-testid="week-grid"
        >
          <div
            className="gap-content-gap shell:w-full shell:min-w-0 grid min-w-max grid-cols-7"
            data-testid="week-grid-columns"
          >
            {days.map((date) => {
              const key = toDate(date);
              const blocks = byDay[key] ?? [];
              return (
                <article
                  key={key}
                  className="border-line-line1 rounded-card p-content-gap gap-inline-gap shell:w-auto shell:min-w-0 flex min-h-56 w-36 flex-col border bg-white"
                >
                  <h3 className="font-body2-heading text-gray-12">
                    {date.toLocaleDateString('ko-KR', {
                      weekday: 'short',
                      day: 'numeric',
                    })}
                  </h3>
                  {blocks.length === 0 ? (
                    <p className="font-caption-normal text-gray-8">
                      비어 있어요
                    </p>
                  ) : (
                    blocks.slice(0, 3).map((block) => (
                      <div
                        key={block.id}
                        className="bg-orange-1 rounded-control-compact p-content-gap text-orange-11 font-caption-normal"
                      >
                        <b className="block">{block.title}</b>
                        <span>
                          {minuteLabel(block.startMin)} ·{' '}
                          {TRACK_LABEL[block.track]}
                        </span>
                        <button
                          type="button"
                          className="min-h-touch-min block underline"
                          onClick={() => mutations.remove.mutate(block.id)}
                          aria-label={`${block.title} 삭제`}
                        >
                          삭제
                        </button>
                        {block.foldedCount > 0 && (
                          <span>+{block.foldedCount}</span>
                        )}
                      </div>
                    ))
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </ScreenState>
    </section>
  );
};
