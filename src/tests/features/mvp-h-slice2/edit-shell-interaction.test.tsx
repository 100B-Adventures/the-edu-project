import { EditShell } from '@/features/edit-shell/components/edit-shell';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithQuery } from '../mvp-h-slice1/helpers';

vi.mock('@/features/edit-shell/components/concept-note-panel', () => ({
  ConceptNotePanel: () => <div>개념노트 내용</div>,
}));

describe('MVP-H 조각 2 편집 셸 조작', () => {
  it('T-EDS-2 창을 붙이고 떼고 여덟 방향 크기와 전체 화면을 실제 조작한다', async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <EditShell
        extraPanels={[
          {
            id: 'references',
            label: '참고자료',
            content: <div>참고자료 내용</div>,
          },
        ]}
      >
        필기 내용
      </EditShell>
    );

    await user.click(screen.getByRole('button', { name: '개념노트' }));
    await user.click(screen.getByRole('button', { name: '참고자료' }));
    expect(screen.getByText('개념노트 내용')).toBeVisible();
    expect(screen.getByText('참고자료 내용')).toBeVisible();
    expect(screen.getByTestId('docked-concept-note')).toBeVisible();
    expect(screen.getByTestId('docked-references')).toBeVisible();
    await user.click(screen.getByRole('button', { name: '개념노트 창 떼기' }));
    const floating = screen.getByTestId('floating-concept-note');
    expect(floating).toBeVisible();
    expect(
      screen.getAllByRole('button', { name: /방향으로 창 크기 조절/ })
    ).toHaveLength(8);

    await user.click(
      screen.getByRole('button', { name: '개념노트 전체 화면' })
    );
    expect(floating).toHaveClass('inset-0');
    await user.click(
      screen.getByRole('button', { name: '개념노트 전체 화면 닫기' })
    );
    await user.click(
      screen.getByRole('button', { name: '개념노트 창 붙이기' })
    );
    expect(screen.queryByTestId('floating-concept-note')).toBeNull();
    expect(screen.getByText('개념노트 내용')).toBeVisible();
  });
});
