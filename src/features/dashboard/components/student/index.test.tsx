import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import DashboardStudent from './index';

const mocks = vi.hoisted(() => ({
  examHallCard: vi.fn(),
}));

vi.mock('@/store', () => ({
  useMemberStore: (selector: (state: object) => unknown) =>
    selector({ member: { email: 'student@example.com' } }),
}));

vi.mock('@/features/exam/hooks/use-exam-query', () => ({
  useAssignedExamsQuery: () => ({ data: [] }),
}));

vi.mock('../../hooks/use-student-dashboard-query', () => ({
  useStudentDashboardStudyRoomListQuery: () => ({
    data: [{ id: 701, name: '수학 집중반' }],
    isPending: false,
  }),
}));

vi.mock('../../connect/hooks/use-connection', () => ({
  useReceivedConnectionList: () => ({ data: { connectionList: [] } }),
}));

vi.mock('@/layout', () => ({
  PageLayout: ({ children }: { children: React.ReactNode }) => (
    <main>{children}</main>
  ),
}));

vi.mock(
  '@/features/teacher-invite/components/student-teacher-invite-card',
  () => ({
    StudentTeacherInviteCard: () => <div>선생님 초대</div>,
  })
);

vi.mock('@/features/unit-note/components/unit-note-entry-card', () => ({
  UnitNoteEntryCard: () => <div>단권화 노트</div>,
}));

vi.mock('./agenda-flow-card', () => ({
  AgendaFlowCard: () => <div>학습 흐름</div>,
}));

vi.mock('./confirm-dialog', () => ({
  ConfirmParentRequestDialog: () => null,
}));

vi.mock('./today-problems-section', () => ({
  TodayProblemsSection: () => <div>오늘의 문제</div>,
}));

vi.mock('./exam-hall-card', () => ({
  ExamHallCard: () => {
    mocks.examHallCard();
    return <div>응시장 열기</div>;
  },
}));

describe('D-034 학생 대시보드 가림 계약', () => {
  beforeEach(() => {
    mocks.examHallCard.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  test('D034-DASH-01 학생 대시보드에서 응시장 카드를 렌더하지 않는다', () => {
    render(<DashboardStudent />);

    expect(screen.getByText('단권화 노트')).toBeVisible();
    expect(screen.queryByText('응시장 열기')).toBeNull();
    expect(mocks.examHallCard).not.toHaveBeenCalled();
  });
});
