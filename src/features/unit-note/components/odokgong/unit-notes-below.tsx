'use client';

import Link from 'next/link';

import {
  solutionNoteKeys,
  solutionNoteRepository,
} from '@/entities/solution-note';
import { monthDayLabel } from '@/features/app-shell/model/format';
import { useUnitNoteDetailQuery } from '@/features/unit-note/hooks/use-unit-note-query';
import { NoteCard } from '@/shared/components/note-card/note-card';
import { ScreenState } from '@/shared/components/screen-state';
import { PRIVATE } from '@/shared/constants';
import { useQuery } from '@tanstack/react-query';

/** 고른 단원 아래에 그 단원의 개념노트와 풀이노트를 같이 보인다(AC-68a). */
export const UnitNotesBelow = ({ nodeId }: { nodeId: number }) => {
  const detailQuery = useUnitNoteDetailQuery(nodeId);
  const solutionsQuery = useQuery({
    queryKey: solutionNoteKeys.byNode(nodeId),
    queryFn: () => solutionNoteRepository.getHistoryByNode(nodeId),
  });
  const pages = detailQuery.data?.detail?.pages ?? [];
  const solutions = solutionsQuery.data?.items ?? [];

  return (
    <section
      aria-label="이 단원의 노트"
      className="gap-block-gap flex flex-col"
    >
      <ScreenState
        status={
          detailQuery.isError
            ? 'error'
            : detailQuery.isPending
              ? 'loading'
              : 'ready'
        }
        error={{ onRetry: () => detailQuery.refetch() }}
      >
        <h2 className="font-body2-heading text-text-main">
          개념노트 {pages.length}
        </h2>
        <ul className="gap-grid-gap tablet:grid-cols-4 grid grid-cols-2">
          {pages.map((page) => (
            <li key={page.pageId}>
              <NoteCard
                kind="concept"
                title={`${page.position}쪽`}
                thumbnailUrl={page.viewUrl}
                updatedLabel={monthDayLabel(page.createdAt) || null}
                href={PRIVATE.DASHBOARD.UNIT_NOTE_ROOM(nodeId)}
              />
            </li>
          ))}
        </ul>
        <h2 className="font-body2-heading text-text-main">
          풀이노트 {solutions.length}
        </h2>
        <ul className="gap-grid-gap tablet:grid-cols-4 grid grid-cols-2">
          {solutions.map((item) => (
            <li key={item.solutionNoteId}>
              <Link href={PRIVATE.DASHBOARD.SOLUTION_NOTE(item.solutionNoteId)}>
                <NoteCard
                  kind="solution"
                  title={`풀이 ${item.solutionNoteId}`}
                  thumbnailUrl={item.thumbUrl}
                  updatedLabel={monthDayLabel(item.submittedAt) || null}
                />
              </Link>
            </li>
          ))}
        </ul>
      </ScreenState>
    </section>
  );
};
