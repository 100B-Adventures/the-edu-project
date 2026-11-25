'use client';

import { useMemo, useState } from 'react';

import { useUnitNoteLibraryQuery } from '@/features/unit-note/hooks/use-unit-note-query';
import { ScreenState } from '@/shared/components/screen-state';
import { SearchInput } from '@/shared/components/ui';
import { SegmentedTabs } from '@/shared/components/ui/segmented-tabs';
import { useStoredChoice } from '@/shared/lib/use-stored-choice';

import { NotesGrid } from './notes-grid';
import {
  NOTE_SORTS,
  NOTE_VIEWS,
  type NoteSort,
  type NoteView,
  SORT_STORAGE_KEY,
  VIEW_STORAGE_KEY,
  filterByQuery,
  leafNodes,
  sortLeaves,
  summarizeSubjects,
} from './notes-model';
import { UnitNotesBelow } from './unit-notes-below';

const SORT_LABELS: Record<NoteSort, string> = {
  recent: '최근 갱신순',
  order: '단원 순서',
  pages: '쪽 많은 순',
};
const VIEW_LABELS: Record<NoteView, string> = {
  bundle: '겹친 묶음',
  book: '책 줄',
};

/** 내 노트: 과목 칩, 보기·정렬, 단원 묶음. 안 쓴 단원은 점선 빈 칸이고 질책하지 않는다(AC-53i). */
export const NotesPage = () => {
  const libraryQuery = useUnitNoteLibraryQuery();
  const [sort, setSort] = useStoredChoice<NoteSort>(
    SORT_STORAGE_KEY,
    'recent',
    NOTE_SORTS
  );
  const [view, setView] = useStoredChoice<NoteView>(
    VIEW_STORAGE_KEY,
    'bundle',
    NOTE_VIEWS
  );
  const [subject, setSubject] = useState<string>('ALL');
  const [query, setQuery] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);

  const nodes = useMemo(
    () => libraryQuery.data?.nodes ?? [],
    [libraryQuery.data]
  );
  const subjects = useMemo(() => summarizeSubjects(nodes), [nodes]);
  const leaves = useMemo(() => {
    const inSubject = leafNodes(nodes).filter(
      (leaf) => subject === 'ALL' || leaf.subject === subject
    );
    return sortLeaves(filterByQuery(inSubject, query), sort);
  }, [nodes, subject, query, sort]);
  const hasAnyNote = nodes.some((node) => node.pageCount > 0);

  return (
    <div
      className="px-section-gap py-section-gap gap-block-gap mx-auto flex w-full max-w-280 flex-col"
      data-testid="notes-page"
    >
      <ScreenState
        status={
          libraryQuery.isError
            ? 'error'
            : libraryQuery.isPending
              ? 'loading'
              : 'ready'
        }
        error={{ onRetry: () => libraryQuery.refetch() }}
      >
        <SegmentedTabs
          ariaLabel="과목"
          items={[
            { id: 'ALL', label: '전체' },
            ...subjects.map((item) => ({
              id: item.subject,
              label: `${item.subject} ${item.written}/${item.total}`,
            })),
          ]}
          value={subject}
          onChange={setSubject}
        />
        <div className="gap-content-gap flex flex-wrap items-center justify-between">
          <SegmentedTabs
            ariaLabel="보기"
            items={NOTE_VIEWS.map((id) => ({ id, label: VIEW_LABELS[id] }))}
            value={view}
            onChange={(id) => setView(id as NoteView)}
          />
          <SegmentedTabs
            ariaLabel="정렬"
            variant="underline"
            items={NOTE_SORTS.map((id) => ({ id, label: SORT_LABELS[id] }))}
            value={sort}
            onChange={(id) => setSort(id as NoteSort)}
          />
        </div>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="단원 이름으로 찾기"
          aria-label="단원 검색"
        />
        {!hasAnyNote && (
          <p className="font-body2-normal text-gray-9">
            첫 노트를 올리면 여기 한 칸이 채워져요.
          </p>
        )}
        <NotesGrid
          leaves={leaves}
          view={view}
          selectedNodeId={selectedNodeId}
          onSelect={setSelectedNodeId}
        />
        {selectedNodeId !== null && (
          <UnitNotesBelow
            key={selectedNodeId}
            nodeId={selectedNodeId}
          />
        )}
      </ScreenState>
    </div>
  );
};
