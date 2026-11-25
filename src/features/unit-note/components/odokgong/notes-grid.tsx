'use client';

import type { UnitNoteNode } from '@/entities/unit-note';
import { monthDayLabel } from '@/features/app-shell/model/format';
import { NoteCard } from '@/shared/components/note-card/note-card';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib';

import type { NoteView } from './notes-model';

type NotesGridProps = {
  leaves: UnitNoteNode[];
  view: NoteView;
  selectedNodeId: number | null;
  onSelect: (nodeId: number) => void;
};

const cardProps = (leaf: UnitNoteNode) =>
  leaf.pageCount > 0
    ? ({
        slot: 'filled',
        kind: 'concept',
        title: leaf.displayName,
        thumbnailUrl: leaf.coverPage?.viewUrl ?? null,
        pageCount: leaf.pageCount,
        updatedLabel: monthDayLabel(leaf.lastPageAt) || null,
      } as const)
    : ({ slot: 'empty', kind: 'concept', title: leaf.displayName } as const);

/**
 * 겹친 묶음(기본)은 단원마다 종이 두 장을 뒤에 깔아 쌓인 느낌을 주고, 책 줄은 한 줄씩 보인다.
 * 390 은 한 열, 834 이상은 격자(AC-53d). 표(role=table)로 그리지 않는다.
 */
export const NotesGrid = ({
  leaves,
  view,
  selectedNodeId,
  onSelect,
}: NotesGridProps) => (
  <ul
    className={cn(
      'gap-grid-gap grid grid-cols-1',
      view === 'bundle' && 'tablet:grid-cols-3 desktop:grid-cols-4',
      view === 'book' && 'tablet:grid-cols-2'
    )}
  >
    {leaves.map((leaf) => {
      const filled = leaf.pageCount > 0;
      return (
        <li
          key={leaf.nodeId}
          className={cn(
            'relative',
            view === 'bundle' && filled && 'pr-1 pb-1',
            selectedNodeId === leaf.nodeId &&
              'rounded-card ring-orange-9 ring-2'
          )}
        >
          {view === 'bundle' && filled && (
            <>
              <span
                aria-hidden
                className="rounded-card border-line-line1 absolute inset-0 translate-x-1 translate-y-1 rotate-1 border bg-white"
              />
              <span
                aria-hidden
                className="rounded-card border-line-line1 absolute inset-0 translate-x-0.5 translate-y-0.5 -rotate-1 border bg-white"
              />
            </>
          )}
          <Button
            type="button"
            variant="unstyled"
            size="none"
            onClick={() => filled && onSelect(leaf.nodeId)}
            disabled={!filled}
            aria-pressed={selectedNodeId === leaf.nodeId}
            className="relative block w-full border-0 text-left whitespace-normal disabled:bg-transparent disabled:opacity-100"
          >
            <NoteCard
              {...cardProps(leaf)}
              density={view === 'book' ? 'row' : 'cover'}
            />
          </Button>
        </li>
      );
    })}
  </ul>
);
