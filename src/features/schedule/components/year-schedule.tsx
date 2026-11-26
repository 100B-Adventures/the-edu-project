'use client';

import { useState } from 'react';

import type { YearEventInput } from '@/features/schedule/api/schedule-api';
import { useYearEventMutations, useYearEventsQuery } from '@/features/schedule/hooks/use-schedule';
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

  return (
    <section className="gap-block-gap flex flex-col" aria-label="연간 일정">
      <div className="flex items-center justify-between">
        <h2 className="font-headline2-heading text-gray-12">{year}년 학습 지도</h2>
        <Button onClick={() => setAdding((value) => !value)}>일정 추가</Button>
      </div>
      {adding && (
        <div className="border-line-line1 rounded-card p-card-pad gap-content-gap grid border bg-white shell:grid-cols-3">
          <Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="예: 2학기 기말고사" aria-label="일정 제목" />
          <Input type="date" value={draft.startsOn} onChange={(event) => setDraft({ ...draft, startsOn: event.target.value })} aria-label="시작일" />
          <Button disabled={!draft.title.trim() || mutations.create.isPending} onClick={() => mutations.create.mutate({ ...draft, title: draft.title.trim() }, { onSuccess: () => setAdding(false) })}>
            저장
          </Button>
        </div>
      )}
      <ScreenState status={query.isPending ? 'loading' : query.isError ? 'error' : query.data?.length ? 'ready' : 'empty'} error={{ onRetry: () => query.refetch() }} empty={{ title: '올해 일정이 아직 없어요', description: '시험과 목표를 추가하면 한 해가 한눈에 보여요.' }}>
        <ol className="gap-content-gap flex flex-col">
          {(query.data ?? []).map((event) => (
            <li key={event.id} className="border-line-line1 rounded-card p-card-pad flex items-center justify-between border bg-white">
              <div>
                <b className="font-body1-heading text-gray-12">{event.title}</b>
                <p className="font-body2-normal text-gray-9">{event.startsOn}{event.endsOn ? ` ~ ${event.endsOn}` : ''}</p>
              </div>
              <Button variant="ghost" onClick={() => mutations.remove.mutate(event.id)}>삭제</Button>
            </li>
          ))}
        </ol>
      </ScreenState>
    </section>
  );
};
