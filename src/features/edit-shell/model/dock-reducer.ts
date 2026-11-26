export type DockPanel = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DockState = {
  docked: string[];
  floating: Record<string, DockPanel>;
  fullscreenId: string | null;
};

export type DockAction =
  | { type: 'OPEN'; panelId: string }
  | { type: 'CLOSE'; panelId: string }
  | { type: 'FLOAT'; panelId: string; x: number; y: number }
  | {
      type: 'RESIZE';
      panelId: string;
      width: number;
      height: number;
    }
  | { type: 'DOCK'; panelId: string }
  | { type: 'FULLSCREEN'; panelId: string }
  | { type: 'RESTORE' };

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const createDockState = (): DockState => ({
  docked: [],
  floating: {},
  fullscreenId: null,
});

export const dockReducer = (
  state: DockState,
  action: DockAction
): DockState => {
  switch (action.type) {
    case 'OPEN':
      return state.docked.includes(action.panelId)
        ? state
        : { ...state, docked: [...state.docked, action.panelId] };
    case 'CLOSE': {
      const floating = { ...state.floating };
      delete floating[action.panelId];
      return {
        docked: state.docked.filter((id) => id !== action.panelId),
        floating,
        fullscreenId:
          state.fullscreenId === action.panelId ? null : state.fullscreenId,
      };
    }
    case 'FLOAT':
      return {
        ...state,
        docked: state.docked.filter((id) => id !== action.panelId),
        floating: {
          ...state.floating,
          [action.panelId]: {
            x: action.x,
            y: action.y,
            width: 360,
            height: 480,
          },
        },
      };
    case 'RESIZE': {
      const panel = state.floating[action.panelId];
      if (!panel) return state;
      return {
        ...state,
        floating: {
          ...state.floating,
          [action.panelId]: {
            ...panel,
            width: clamp(action.width, 280, 960),
            height: clamp(action.height, 240, 900),
          },
        },
      };
    }
    case 'DOCK': {
      const floating = { ...state.floating };
      delete floating[action.panelId];
      return {
        ...state,
        floating,
        docked: state.docked.includes(action.panelId)
          ? state.docked
          : [...state.docked, action.panelId],
      };
    }
    case 'FULLSCREEN':
      return { ...state, fullscreenId: action.panelId };
    case 'RESTORE':
      return { ...state, fullscreenId: null };
  }
};
