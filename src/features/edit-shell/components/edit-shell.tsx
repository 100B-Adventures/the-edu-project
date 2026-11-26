'use client';

import {
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useReducer,
  useState,
} from 'react';

import { Button } from '@/shared/components/ui/button';

import { createDockState, dockReducer } from '../model/dock-reducer';
import { ConceptNotePanel } from './concept-note-panel';
import { type EditViewMode, ViewModeSwitch } from './view-mode-switch';

const RESIZE_POSITION: Record<string, string> = {
  n: 'left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-n-resize',
  ne: 'right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-ne-resize',
  e: 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-e-resize',
  se: 'right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-se-resize',
  s: 'left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-s-resize',
  sw: 'left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-sw-resize',
  w: 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-w-resize',
  nw: 'left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nw-resize',
};

export const EditShell = ({
  children,
  challengeId,
  extraPanels = [],
}: {
  children: ReactNode;
  challengeId?: number;
  extraPanels?: Array<{ id: string; label: string; content: ReactNode }>;
}) => {
  const [view, setView] = useState<EditViewMode>(() => {
    if (typeof window === 'undefined') return 'split';
    return (
      (localStorage.getItem('odk.solve.view') as EditViewMode | null) ?? 'split'
    );
  });
  const [dock, dispatch] = useReducer(dockReducer, undefined, () => {
    if (typeof window === 'undefined') return createDockState();
    try {
      const saved = localStorage.getItem('odk.solve.dock');
      return saved ? JSON.parse(saved) : createDockState();
    } catch {
      return createDockState();
    }
  });
  const panels = [
    {
      id: 'concept-note',
      label: '개념노트',
      content: <ConceptNotePanel challengeId={challengeId} />,
    },
    ...extraPanels,
  ];
  const panelById = new Map(panels.map((panel) => [panel.id, panel]));

  useEffect(() => {
    localStorage.setItem('odk.solve.view', view);
  }, [view]);

  useEffect(() => {
    localStorage.setItem('odk.solve.dock', JSON.stringify(dock));
  }, [dock]);

  const beginResize = (
    panelId: string,
    direction: string,
    event: ReactPointerEvent<HTMLButtonElement>
  ) => {
    const floating = dock.floating[panelId];
    if (!floating) return;
    const start = { x: event.clientX, y: event.clientY, panel: floating };
    const move = (pointer: PointerEvent) => {
      const dx = pointer.clientX - start.x;
      const dy = pointer.clientY - start.y;
      const west = direction.includes('w');
      const north = direction.includes('n');
      dispatch({
        type: 'RESIZE',
        panelId,
        width:
          start.panel.width + (west ? -dx : direction.includes('e') ? dx : 0),
        height:
          start.panel.height + (north ? -dy : direction.includes('s') ? dy : 0),
        x: west ? start.panel.x + dx : start.panel.x,
        y: north ? start.panel.y + dy : start.panel.y,
      });
    };
    const stop = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
  };

  return (
    <div
      className="gap-content-gap flex min-w-0 flex-col"
      data-view={view}
    >
      <ViewModeSwitch
        value={view}
        onChange={setView}
      />
      <div className="gap-content-gap shell:grid-cols-[minmax(0,1fr)_20rem] grid min-w-0">
        <div className="min-w-0">{children}</div>
        {dock.docked.some((panelId) => panelById.has(panelId)) && (
          <aside className="gap-content-gap flex min-h-96 flex-col">
            {dock.docked.map((panelId) => {
              const panel = panelById.get(panelId);
              return panel ? (
                <section
                  key={panelId}
                  className="border-line-line1 rounded-card p-card-pad bg-gray-1 border"
                  data-testid={`docked-${panelId}`}
                >
                  {panel.content}
                </section>
              ) : null;
            })}
          </aside>
        )}
      </div>
      <nav
        className="border-line-line1 rounded-card p-content-gap gap-inline-gap bottom-tabbar-height sticky flex flex-wrap border bg-white"
        aria-label="편집 도구"
      >
        {panels.map((panel, index) => {
          const open =
            dock.docked.includes(panel.id) || Boolean(dock.floating[panel.id]);
          return (
            <div
              key={panel.id}
              className="gap-inline-gap flex"
            >
              <Button
                variant="outlined"
                onClick={() =>
                  dispatch(
                    open
                      ? { type: 'CLOSE', panelId: panel.id }
                      : { type: 'OPEN', panelId: panel.id }
                  )
                }
              >
                {panel.label}
              </Button>
              {open && (
                <Button
                  variant="ghost"
                  aria-label={`${panel.label} 창 떼기`}
                  onClick={() =>
                    dispatch({
                      type: 'FLOAT',
                      panelId: panel.id,
                      x: 24 + index * 32,
                      y: 24 + index * 32,
                    })
                  }
                >
                  창 떼기
                </Button>
              )}
            </div>
          );
        })}
      </nav>
      {Object.entries(dock.floating).map(([panelId, floating]) => {
        const panel = panelById.get(panelId);
        if (!panel) return null;
        const fullscreen = dock.fullscreenId === panelId;
        return (
          <section
            key={panelId}
            data-testid={`floating-${panelId}`}
            className={`border-line-line1 fixed z-50 overflow-visible border bg-white shadow-xl ${fullscreen ? 'inset-0' : 'rounded-card'}`}
            style={
              fullscreen
                ? undefined
                : {
                    left: floating.x,
                    top: floating.y,
                    width: floating.width,
                    height: floating.height,
                  }
            }
          >
            <div className="p-card-pad h-full overflow-auto">
              <div className="gap-inline-gap mb-content-gap flex flex-wrap justify-end">
                <Button
                  variant="ghost"
                  aria-label={`${panel.label} 창 붙이기`}
                  onClick={() => dispatch({ type: 'DOCK', panelId })}
                >
                  창 붙이기
                </Button>
                <Button
                  variant="ghost"
                  aria-label={
                    fullscreen
                      ? `${panel.label} 전체 화면 닫기`
                      : `${panel.label} 전체 화면`
                  }
                  onClick={() =>
                    dispatch(
                      fullscreen
                        ? { type: 'RESTORE' }
                        : { type: 'FULLSCREEN', panelId }
                    )
                  }
                >
                  {fullscreen ? '전체 화면 닫기' : '전체 화면'}
                </Button>
                <Button
                  variant="ghost"
                  aria-label={`${panel.label} 창 닫기`}
                  onClick={() => dispatch({ type: 'CLOSE', panelId })}
                >
                  창 닫기
                </Button>
              </div>
              {panel.content}
            </div>
            {!fullscreen &&
              ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'].map((direction) => (
                <button
                  key={direction}
                  type="button"
                  aria-label={`${panel.label} ${direction} 방향으로 창 크기 조절`}
                  data-resize-direction={direction}
                  className={`absolute flex size-11 items-center justify-center ${RESIZE_POSITION[direction]}`}
                  onPointerDown={(event) =>
                    beginResize(panelId, direction, event)
                  }
                >
                  <span
                    className="bg-orange-7 size-3 rounded-full"
                    aria-hidden
                  />
                </button>
              ))}
          </section>
        );
      })}
    </div>
  );
};
