import { DashboardSidebar } from '@/features/dashboard/components/dashboard-sidebar';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  assignedExams: vi.fn(),
  rooms: vi.fn(),
  wrongAnswers: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/student',
}));

vi.mock('@/shared/hooks/use-role', () => ({
  useRole: () => ({ role: 'ROLE_STUDENT', isLoading: false }),
}));

vi.mock('@/features/auth/hooks/use-auth', () => ({
  useAuth: () => ({ logout: vi.fn() }),
}));

vi.mock('@/features/dashboard/hooks/use-student-dashboard-query', () => ({
  useStudentDashboardStudyRoomListQuery: mocks.rooms,
}));

vi.mock('@/features/dashboard/hooks/use-wrong-answer-query', () => ({
  useWrongAnswersQuery: mocks.wrongAnswers,
}));

vi.mock('@/features/exam/hooks/use-exam-query', () => ({
  useAssignedExamsQuery: mocks.assignedExams,
}));

vi.mock('@/shared/lib/analytics', () => ({
  trackGnbLogoutClick: vi.fn(),
}));

describe('MVP-G 학생 선생님 연결 사이드바 계약', () => {
  beforeEach(() => {
    mocks.assignedExams.mockReturnValue({ data: [] });
    mocks.wrongAnswers.mockReturnValue({ data: { totalCount: 0, items: [] } });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  test('TC-INV-006 유예 중이어도 미연결 학생은 선생님 연결 경로를 유지한다', () => {
    mocks.rooms.mockReturnValue({
      data: [],
      isPending: false,
      isSuccess: true,
    });

    const { container } = render(<DashboardSidebar />);

    expect(screen.getByRole('link', { name: '선생님 연결' })).toHaveAttribute(
      'href',
      '/dashboard/connections'
    );
    expect(
      container.querySelector('[data-sidebar-mode="full-from-tablet"]')
    ).toHaveClass('w-sidebar-width');
  });

  test('TC-INV-020 승인된 방이 생기면 선생님 연결 발행 경로를 숨긴다', () => {
    mocks.rooms.mockReturnValue({
      data: [{ id: 701, name: '김학생 학습방' }],
      isPending: false,
      isSuccess: true,
    });

    render(<DashboardSidebar />);

    expect(screen.queryByText('선생님 연결')).toBeNull();
    expect(screen.getByRole('link', { name: '김학생 학습방' })).toBeVisible();
  });

  test('TC-INV-020 조회 중에는 미연결로 오판해 발행 경로를 깜빡이지 않는다', () => {
    mocks.rooms.mockReturnValue({
      data: undefined,
      isPending: true,
      isSuccess: false,
    });

    render(<DashboardSidebar />);

    expect(screen.queryByText('선생님 연결')).toBeNull();
  });

  test('TC-SHELL-001 태블릿 사이드바는 ACTIVE 중 회독 기한이 도래한 오답만 표시한다', () => {
    mocks.rooms.mockReturnValue({
      data: [],
      isPending: false,
      isSuccess: true,
    });
    mocks.wrongAnswers.mockReturnValue({
      data: {
        totalCount: 4,
        items: [
          {
            id: 1,
            status: 'ACTIVE',
            nextReviewAt: '2026-09-02T00:00:00.000Z',
          },
          { id: 2, status: 'ACTIVE', nextReviewAt: null },
          {
            id: 3,
            status: 'ACTIVE',
            nextReviewAt: '2099-01-01T00:00:00.000Z',
          },
          {
            id: 4,
            status: 'GRADUATED',
            nextReviewAt: '2026-09-01T00:00:00.000Z',
          },
        ],
      },
    });
    mocks.assignedExams.mockReturnValue({
      data: [
        { status: 'ASSIGNED' },
        { status: 'IN_PROGRESS' },
        { status: 'ANALYZED' },
      ],
    });

    render(<DashboardSidebar />);

    expect(screen.getByRole('link', { name: '오답 회독 2' })).toBeVisible();
    expect(screen.getByRole('link', { name: '응시장 2' })).toBeVisible();
  });
});
