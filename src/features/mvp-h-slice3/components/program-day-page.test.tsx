import { renderWithProviders } from '@/tests/utils';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ProgramDayPage, ProgramPathPage } from './library-program-pages';

const mocks = vi.hoisted(() => ({
  programDay: vi.fn(),
  program: vi.fn(),
  programDays: vi.fn(),
  useBufferCoupon: vi.fn(),
  submitProgramDay: vi.fn(),
}));

vi.mock('../api/slice3.repository', () => ({
  slice3Repository: mocks,
}));

describe('MVP-H 조각 3 58일 진행일', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.programDay.mockResolvedValue({
      dayNo: 17,
      title: '17일차',
      status: 'OPEN',
      videoUnlocked: false,
      submitted: false,
      referenceAnchors: [],
      date: '2026-11-22',
      assignments: [
        {
          assignmentKey: 'NOTE:17',
          type: 'NOTE',
          challengeId: null,
          lessonId: null,
          status: 'TODO',
        },
      ],
      done: false,
    });
    mocks.program.mockResolvedValue({
      enrollmentId: 2,
      courseTitle: '58일 오독공',
      status: 'ACTIVE',
      currentDay: 22,
      totalDays: 58,
      bufferCoupons: 1,
      coupons: [{ id: 7, expiresOn: '2026-12-31' }],
    });
    mocks.programDays.mockResolvedValue([
      {
        dayNo: 17,
        title: '17일차',
        status: 'MISSED',
        videoUnlocked: false,
        submitted: false,
        referenceAnchors: [],
        date: '2026-11-17',
        assignments: [],
        done: false,
      },
      {
        dayNo: 23,
        title: '23일차',
        status: 'LOCKED',
        videoUnlocked: false,
        submitted: false,
        referenceAnchors: [],
        date: '2026-11-23',
        assignments: [],
        done: false,
      },
    ]);
    mocks.useBufferCoupon.mockResolvedValue(undefined);
    mocks.submitProgramDay.mockResolvedValue({
      dayNo: 17,
      title: '17일차',
      status: 'SUBMITTED',
      videoUnlocked: true,
      submitted: true,
      referenceAnchors: ['교재 쪽: 42쪽'],
      date: '2026-11-22',
      assignments: [],
      done: false,
    });
  });

  test('T-P58-4 제출 전 영상은 잠기고 풀이 제출 뒤 열린다', async () => {
    renderWithProviders(<ProgramDayPage dayNo={17} />);

    expect(
      await screen.findByText('제출 전에는 영상이 잠겨 있어요.')
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: '영상 이어 보기' })
    ).toBeDisabled();

    fireEvent.change(screen.getByLabelText('오늘 풀이'), {
      target: { value: '막힌 식을 다시 정리했어요.' },
    });
    fireEvent.change(screen.getByLabelText('교재 쪽'), {
      target: { value: '42쪽' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: '풀이 제출하고 영상 열기' })
    );

    await waitFor(() =>
      expect(mocks.submitProgramDay).toHaveBeenCalledWith(
        17,
        '막힌 식을 다시 정리했어요.',
        ['교재 쪽: 42쪽']
      )
    );
  });

  test('T-P58-5 참고 위치가 없으면 제출하지 않는다', async () => {
    renderWithProviders(<ProgramDayPage dayNo={17} />);
    fireEvent.change(await screen.findByLabelText('오늘 풀이'), {
      target: { value: '풀이' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: '풀이 제출하고 영상 열기' })
    );

    expect(
      screen.getByText('풀이와 참고 위치를 하나 이상 남겨 주세요.')
    ).toBeVisible();
    expect(mocks.submitProgramDay).not.toHaveBeenCalled();
  });

  test('T-P58-3 지나간 날만 버퍼 쿠폰으로 열고 미래 날짜는 잠근다', async () => {
    renderWithProviders(<ProgramPathPage />);

    expect(await screen.findByText('메우는 날')).toBeVisible();
    expect(screen.getAllByText('시작 전').length).toBeGreaterThan(0);
    expect(
      screen.getByRole('button', { name: '버퍼 쿠폰으로 열기' })
    ).toBeEnabled();
    expect(screen.getByRole('button', { name: '시작 전' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '버퍼 쿠폰으로 열기' }));
    await waitFor(() =>
      expect(mocks.useBufferCoupon).toHaveBeenCalledWith(7, '2026-11-17')
    );
  });

  test('T-P58-1 과제 키별 자동 집계 상태를 화면에 보인다', async () => {
    renderWithProviders(<ProgramDayPage dayNo={17} />);
    expect(await screen.findByText('할 일 · 오늘 풀이 기록')).toBeVisible();
  });
});
