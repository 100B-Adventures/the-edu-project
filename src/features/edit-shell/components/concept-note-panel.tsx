'use client';

import { useState } from 'react';

import { useNoteSearch } from '@/features/unit-note/hooks/use-note-collaboration';
import { ScreenState } from '@/shared/components/screen-state';
import { Input } from '@/shared/components/ui/input';
import { SegmentedTabs } from '@/shared/components/ui/segmented-tabs';

export const ConceptNotePanel = ({ challengeId }: { challengeId?: number }) => {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('PROBLEM');
  const notes = useNoteSearch(query, tab, challengeId);

  return (
    <section className="gap-content-gap flex h-full flex-col" aria-label="개념노트 창">
      <h2 className="font-body1-heading text-gray-12">개념노트</h2>
      <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="노트 찾기" aria-label="개념노트 찾기" />
      <SegmentedTabs ariaLabel="노트 범위" items={[
        { id: 'PROBLEM', label: '이 문제' },
        { id: 'RECENT', label: '최근' },
        { id: 'UNIT', label: '단원' },
      ]} value={tab} onChange={setTab} />
      <ScreenState status={notes.isPending ? 'loading' : notes.isError ? 'error' : notes.data?.items.length ? 'ready' : 'empty'} error={{ onRetry: () => notes.refetch() }} empty={{ title: '맞는 노트가 아직 없어요' }}>
        <ul className="gap-inline-gap flex flex-col overflow-y-auto">
          {(notes.data?.items ?? []).map((note) => (
            <li key={note.pageId} className="border-line-line1 rounded-control-compact p-content-gap border bg-white">
              <b className="font-body2-heading text-gray-12">{note.title}</b>
              <p className="font-caption-normal text-gray-9">{note.nodeName} · 판 {Math.max(1, note.revisionCount)}</p>
            </li>
          ))}
        </ul>
      </ScreenState>
    </section>
  );
};
