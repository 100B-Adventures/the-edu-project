import { PinPanel } from '@/features/unit-note/components/odokgong/note-viewer';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithQuery } from '../mvp-h-slice1/helpers';

const mocks = vi.hoisted(() => ({ add: vi.fn(), update: vi.fn() }));

vi.mock('@/features/unit-note/hooks/use-note-collaboration', () => ({
  useNotePins: () => ({ data: [] }),
  useNotePinMutations: () => ({
    add: { mutate: mocks.add, isPending: false },
    update: { mutate: mocks.update, isPending: false },
  }),
}));

describe('MVP-H 조각 2 핀 작성', () => {
  it('T-NOTE-2 선생님이 보이는 입력에서 핀을 작성해 현재 판 중앙에 단다', async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <PinPanel
        pageId={9}
        scope="teacher"
      />
    );

    await user.type(
      screen.getByRole('textbox', { name: '핀 내용' }),
      '식을 한 줄 더 써 봐요'
    );
    await user.click(screen.getByRole('button', { name: '핀 달기' }));

    expect(mocks.add).toHaveBeenCalledWith(
      { versionNo: 1, x: 0.5, y: 0.5, body: '식을 한 줄 더 써 봐요' },
      expect.any(Object)
    );
  });
});
