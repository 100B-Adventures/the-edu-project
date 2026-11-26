import { NoteWritePage } from '@/features/unit-note/components/note-write/note-write-page';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithQuery } from '../mvp-h-slice1/helpers';

const mocks = vi.hoisted(() => ({
  saveVersion: vi.fn(),
  createActivitySession: vi.fn(),
}));

vi.mock('@/features/edit-shell/components/edit-shell', () => ({
  EditShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
vi.mock('@/features/unit-note/components/note-write/reference-drawer', () => ({
  ReferenceDrawer: () => null,
}));
vi.mock('@/shared/components/drawing', () => ({
  SolutionDrawingPad: ({
    onStrokesChange,
  }: {
    onStrokesChange: (value: unknown[]) => void;
  }) => (
    <button
      type="button"
      onClick={() => onStrokesChange([{ id: 'stroke-1', points: [] }])}
    >
      시험 획 추가
    </button>
  ),
}));
vi.mock('@/features/unit-note/api/collaboration-api', () => ({
  collaborationApi: { saveVersion: mocks.saveVersion },
}));
vi.mock('@/features/schedule/api/schedule-api', () => ({
  scheduleApi: { createActivitySession: mocks.createActivitySession },
}));

describe('MVP-H 조각 2 노트 쓰기', () => {
  it('T-EDS-1 손글씨 획을 판에 저장하고 활동 시간도 연결한다', async () => {
    mocks.saveVersion.mockResolvedValue({ id: 3, versionNo: 2 });
    mocks.createActivitySession.mockResolvedValue({ id: 7, actualMinutes: 1 });
    const user = userEvent.setup();
    renderWithQuery(
      <NoteWritePage
        nodeId={12}
        pageId={9}
      />
    );

    expect(screen.getByText('활동 0분 0초')).toBeVisible();
    await user.click(screen.getByRole('button', { name: '시험 획 추가' }));
    await user.click(screen.getByRole('button', { name: '새 판 저장' }));

    await waitFor(() => expect(mocks.saveVersion).toHaveBeenCalled());
    expect(JSON.parse(mocks.saveVersion.mock.calls[0][2]).strokes).toHaveLength(
      1
    );
    expect(mocks.createActivitySession).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'NOTE_WRITE',
        refType: 'UNIT_NOTE_PAGE',
        refId: 9,
      })
    );
  });
});
