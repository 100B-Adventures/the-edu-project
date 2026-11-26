import {
  createDockState,
  dockReducer,
} from '@/features/edit-shell/model/dock-reducer';
import { describe, expect, it } from 'vitest';

describe('MVP-H 조각 2 편집 셸 창 배치', () => {
  it('T-EDS-2 붙인 창을 떼고 크기를 제한하고 전체 화면에서 복원한다', () => {
    const opened = dockReducer(createDockState(), {
      type: 'OPEN',
      panelId: 'concept-note',
    });
    const floated = dockReducer(opened, {
      type: 'FLOAT',
      panelId: 'concept-note',
      x: 20,
      y: 30,
    });
    const resized = dockReducer(floated, {
      type: 'RESIZE',
      panelId: 'concept-note',
      width: 100,
      height: 2000,
    });
    const fullscreen = dockReducer(resized, {
      type: 'FULLSCREEN',
      panelId: 'concept-note',
    });

    expect(resized.floating['concept-note']).toMatchObject({
      width: 280,
      height: 900,
    });
    expect(fullscreen.fullscreenId).toBe('concept-note');
    expect(dockReducer(fullscreen, { type: 'RESTORE' }).fullscreenId).toBeNull();
  });
});
