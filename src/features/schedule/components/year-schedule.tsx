'use client';

import { useState } from 'react';

import type { YearEventInput } from '@/features/schedule/api/schedule-api';
import {
  useYearEventMutations,
  useYearEventsQuery,
} from '@/features/schedule/hooks/use-schedule';
import { ScreenState } from '@/shared/components/screen-state';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

export const YearSchedule = () => {
  const year = new Date().getFullYear();
  const query = useYearEventsQuery(`${year}-01-01`, `${year}-12-31`);
  const mutations = useYearEventMutations();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<YearEventInput>({
    kind: 'EXAM',
    title: '',
    startsOn: `${year}-11-26`,
    endsOn: null,
    targetGrade: null,
  });
  const today = new Date();
  const months = Array.from({ length: 12 }, (_, index) => index + 1);

  return (
    <section
      className="gap-block-gap flex flex-col"
      aria-label="연간 일정"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-headline2-heading text-gray-12">
          {year}년 학습 지도
        </h2>
        <Button onClick={() => setAdding((value) => !value)}>일정 추가</Button>
      </div>
      {adding && (
        <div className="border-line-line1 rounded-card p-card-pad gap-content-gap shell:grid-cols-3 grid border bg-white">
          <Input
            value={draft.title}
            onChange={(event) =>
              setDraft({ ...draft, title: event.target.value })
            }
            placeholder="예: 2학기 기말고사"
            aria-label="일정 제목"
          />
          <Input
            type="date"
            value={draft.startsOn}
            onChange={(event) =>
              setDraft({ ...draft, startsOn: event.target.value })
            }
            aria-label="시작일"
          />
          <Button
            disabled={!draft.title.trim() || mutations.create.isPending}
            onClick={() =>
              mutations.create.mutate(
                { ...draft, title: draft.title.trim() },
                { onSuccess: () => setAdding(false) }
              )
            }
          >
            저장
          </Button>
        </div>
      )}
      <ScreenState
        status={query.isPending ? 'loading' : query.isError ? 'error' : 'ready'}
        error={{ onRetry: () => query.refetch() }}
      >
        <ol className="gap-content-gap flex flex-col">
          {months.map((month) => {
            const events = (query.data ?? []).filter(
              (event) => Number(event.startsOn.slice(5, 7)) === month
            );
            const current =
              today.getFullYear() === year && today.getMonth() + 1 === month;
            return (
              <li
                key={month}
                data-testid="year-month-row"
                data-current-month={current ? 'true' : 'false'}
                className="border-line-line1 rounded-card p-card-pad gap-content-gap shell:grid-cols-[5rem_1fr] grid min-h-20 border bg-white"
              >
                <div>
                  <b className="font-body1-heading text-gray-12">{month}월</b>
                  {current && (
                    <p className="font-caption-normal text-orange-10">오늘</p>
                  )}
                </div>
                {events.length === 0 ? (
                  <p className="font-body2-normal text-gray-8">
                    등록한 일정이 없어요
                  </p>
                ) : (
                  <ul className="gap-inline-gap flex flex-col">
                    {events.map((event) => (
                      <li
                        key={event.id}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <b className="font-body1-heading text-gray-12">
                            {event.title}
                          </b>
                          <p className="font-body2-normal text-gray-9">
                            {event.startsOn}
                            {event.endsOn ? ` ~ ${event.endsOn}` : ''}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          onClick={() => mutations.remove.mutate(event.id)}
                        >
                          삭제
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      </ScreenState>
    </section>
  );
};
