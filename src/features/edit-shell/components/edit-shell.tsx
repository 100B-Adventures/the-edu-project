'use client';

import { type ReactNode, useReducer, useState } from 'react';

import { Button } from '@/shared/components/ui/button';

import { createDockState, dockReducer } from '../model/dock-reducer';
import { ConceptNotePanel } from './concept-note-panel';
import { type EditViewMode, ViewModeSwitch } from './view-mode-switch';

export const EditShell = ({ children, challengeId }: { children: ReactNode; challengeId?: number }) => {
  const [view, setView] = useState<EditViewMode>(() => {
    if (typeof window === 'undefined') return 'split';
    return (localStorage.getItem('odk.solve.view') as EditViewMode | null) ?? 'split';
  });
  const [dock, dispatch] = useReducer(dockReducer, undefined, createDockState);
  const conceptOpen = dock.docked.includes('concept-note') || Boolean(dock.floating['concept-note']);

  return (
    <div className="gap-content-gap flex min-w-0 flex-col" data-view={view}>
      <ViewModeSwitch value={view} onChange={setView} />
      <div className="gap-content-gap grid min-w-0 shell:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">{children}</div>
        {conceptOpen && (
          <aside className="border-line-line1 rounded-card p-card-pad min-h-96 border bg-gray-1">
            <ConceptNotePanel challengeId={challengeId} />
          </aside>
        )}
      </div>
      <nav className="border-line-line1 rounded-card p-content-gap gap-inline-gap sticky bottom-tabbar-height flex flex-wrap border bg-white" aria-label="편집 도구">
        <Button variant="outlined" onClick={() => dispatch(conceptOpen ? { type: 'CLOSE', panelId: 'concept-note' } : { type: 'OPEN', panelId: 'concept-note' })}>
          개념노트
        </Button>
        {conceptOpen && (
          <Button variant="ghost" onClick={() => dispatch({ type: 'FLOAT', panelId: 'concept-note', x: 24, y: 24 })}>
            창 떼기
          </Button>
        )}
      </nav>
    </div>
  );
};
