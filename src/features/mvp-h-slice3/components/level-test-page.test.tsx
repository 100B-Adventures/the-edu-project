import { renderWithProviders } from '@/tests/utils';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { LevelTestPage } from './level-test-page';

const mocks = vi.hoisted(() => ({
  startLevel: vi.fn(),
  answerLevel: vi.fn(),
  submitLevel: vi.fn(),
  levelResult: vi.fn(),
}));

vi.mock('../api/slice3.repository', () => ({
  slice3Repository: mocks,
}));

describe('MVP-H 조각 3 레벨 테스트', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.startLevel.mockResolvedValue({
      testId: 7,
      currentStep: 1,
      status: 'IN_PROGRESS',
      problemSetIds: [11, 12, 13],
    });
    mocks.answerLevel.mockResolvedValue(undefined);
    mocks.submitLevel.mockResolvedValue({
      testId: 7,
      resultCode: 'REVIEWING',
      summary: '선생님 확인 중',
      status: 'WAITING_TEACHER',
      benefitKind: 'NONE',
    });
  });

  test('T-LT-13 세 줄 확인 전에는 시작이 닫히고 다른 길은 눌린다', () => {
    renderWithProviders(<LevelTestPage />);

    expect(
      screen.getByRole('button', { name: '레벨 테스트 시작하기' })
    ).toBeDisabled();
    expect(
      screen.getByRole('link', { name: '전자책부터 둘러보기' })
    ).toHaveAttribute('href', '/courses');
    expect(
      screen.getByRole('link', { name: '고민 상담 보기' })
    ).toHaveAttribute('href', '/consult');
  });

  test('T-LT-1 세 줄 확인 뒤 시작을 누르면 세 답안 입력이 보인다', async () => {
    renderWithProviders(<LevelTestPage />);

    for (const checkbox of screen.getAllByRole('checkbox').slice(0, 3)) {
      fireEvent.click(checkbox);
    }
    fireEvent.click(screen.getByLabelText(/개인정보 처리/));
    fireEvent.click(
      screen.getByRole('button', { name: '레벨 테스트 시작하기' })
    );
    fireEvent.change(screen.getByLabelText('학년'), {
      target: { value: '고2' },
    });
    fireEvent.change(screen.getByLabelText('현재 성적'), {
      target: { value: '3등급' },
    });
    fireEvent.change(screen.getByLabelText('목표'), {
      target: { value: '풀이 습관 고치기' },
    });
    fireEvent.change(screen.getByLabelText('공부 고민'), {
      target: { value: '계산에서 자주 막혀요' },
    });
    fireEvent.click(screen.getByRole('button', { name: '문제 풀기 시작' }));

    await waitFor(() =>
      expect(mocks.startLevel).toHaveBeenCalledWith({
        privacyConsent: true,
        aiConsent: false,
        schoolLevel: '고2',
        currentGrade: '3등급',
        goal: '풀이 습관 고치기',
        worry: '계산에서 자주 막혀요',
      })
    );
    expect(screen.getByLabelText('1번 답안')).toBeVisible();
    expect(screen.getByLabelText('2번 답안')).toBeVisible();
    expect(screen.getByLabelText('3번 답안')).toBeVisible();
  });

  test('T-LT-4 세 답안을 접수하면 확정 아닌 대기 결과를 보여 준다', async () => {
    renderWithProviders(<LevelTestPage />);
    for (const checkbox of screen.getAllByRole('checkbox').slice(0, 3)) {
      fireEvent.click(checkbox);
    }
    fireEvent.click(screen.getByLabelText(/개인정보 처리/));
    fireEvent.click(
      screen.getByRole('button', { name: '레벨 테스트 시작하기' })
    );
    fireEvent.change(screen.getByLabelText('학년'), {
      target: { value: '고2' },
    });
    fireEvent.change(screen.getByLabelText('현재 성적'), {
      target: { value: '3등급' },
    });
    fireEvent.change(screen.getByLabelText('목표'), {
      target: { value: '풀이 습관 고치기' },
    });
    fireEvent.change(screen.getByLabelText('공부 고민'), {
      target: { value: '계산에서 자주 막혀요' },
    });
    fireEvent.click(screen.getByRole('button', { name: '문제 풀기 시작' }));
    for (const index of [1, 2, 3]) {
      fireEvent.change(await screen.findByLabelText(`${index}번 답안`), {
        target: { value: `${index}번 풀이` },
      });
    }
    fireEvent.click(screen.getByRole('button', { name: '답안 접수하기' }));

    expect(
      await screen.findByText('선생님이 답안을 확인하고 있어요')
    ).toBeVisible();
    expect(mocks.answerLevel).toHaveBeenCalledTimes(3);
    expect(screen.getByText('혜택은 아직 미정이에요.')).toBeVisible();
  });
});
