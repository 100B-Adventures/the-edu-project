import { StudentReviewSummary } from '@/features/teaching-lesson/components/student-review-summary';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithQuery } from './helpers';

const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/shared/api', () => ({ api: { private: { get: mocks.get } } }));

describe('시험 항목 S27 선생님 학생 현황', () => {
  beforeEach(() => {
    mocks.get.mockResolvedValue({
      studentId: 2,
      activeCount: 3,
      dueNow: 1,
      graduatedCount: 0,
      recentNotes: [
        {
          solutionNoteId: 9,
          title: '미분',
          challengeId: 11,
          submittedAt: '2026-11-23T09:00:00',
          isCorrect: false,
          labels: ['WRONG'],
          stuckReasons: [],
          versionCount: 1,
          thumbUrl: null,
        },
      ],
      reasonDistribution: {},
      origins: {},
    });
  });

  it('S27-1 최근 풀이노트는 학생 전용 주소로 가는 링크가 아니라 제목만 보인다(선생님용 읽기 API 없음)', async () => {
    renderWithQuery(<StudentReviewSummary studentId={2} />);
    const row = await screen.findByTestId('student-note-row');
    expect(row).toHaveTextContent('미분');
    expect(row.closest('a')).toBeNull();
    expect(document.querySelectorAll('a[href*="solution-notes"]')).toHaveLength(
      0
    );
  });
});
