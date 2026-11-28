import { notification as notificationEntity } from '@/entities/notification';
import { NotificationPopover } from '@/features/notifications/components/notification-popover';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  notifications: vi.fn(),
  unread: vi.fn(),
  refetchUnread: vi.fn(),
  markAsRead: vi.fn(),
  deleteNotifications: vi.fn(),
  role: 'ROLE_TEACHER',
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock('@/features/notifications/components/notification-icon', () => ({
  default: ({ hasNotifications }: { hasNotifications: boolean }) => (
    <span
      aria-hidden
      data-testid="notification-icon"
      data-has-notifications={hasNotifications ? 'true' : 'false'}
    >
      bell
    </span>
  ),
}));

vi.mock('@/features/notifications/hooks/use-notifications', () => ({
  useNotifications: () => mocks.notifications(),
  useUnreadNotifications: () => mocks.unread(),
  useMarkAsRead: () => ({ mutate: mocks.markAsRead }),
  useDeleteNotifications: () => ({ mutate: mocks.deleteNotifications }),
}));

vi.mock('@/shared/lib/analytics', () => ({
  trackGnbAlarmClick: vi.fn(),
}));

vi.mock('@/store', () => ({
  useMemberStore: (
    selector: (state: { member: { role: string } }) => unknown
  ) => selector({ member: { role: mocks.role } }),
}));

describe('S13 알림 목록 상호작용', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.role = 'ROLE_TEACHER';
    mocks.notifications.mockReturnValue({
      data: [
        {
          id: 41,
          message: '질문에 답변이 달렸어요.',
          category: 'QNA',
          categoryKorean: '질문',
          targetMetadata: { studyRoomId: '7', qnaId: '11' },
          targetUrl: '/study-rooms/7/qna/11',
          relativeTime: '방금 전',
          isRead: false,
        },
      ],
      isLoading: false,
      error: null,
    });
    mocks.unread.mockReturnValue({
      data: [{ id: 41, category: 'QNA' }],
      refetch: mocks.refetchUnread,
    });
  });

  it('알림 행은 키보드로 작동하는 버튼이며 읽음 처리 후 정확한 대상으로 이동한다', async () => {
    const user = userEvent.setup();
    render(<NotificationPopover />);

    await user.click(screen.getByRole('button', { name: '알림 확인' }));
    const notification = await screen.findByTestId('notification-item-41');

    expect(notification.tagName).toBe('BUTTON');
    expect(notification).toHaveClass('focus-ring');
    await user.click(notification);

    expect(mocks.markAsRead).toHaveBeenCalledWith([41]);
    expect(mocks.push).toHaveBeenCalledWith('/study-rooms/7/qna/11');
  });

  it('학생에게 과제 알림 배지와 행을 노출하고 metadata의 상세 대상으로 읽음 이동한다', async () => {
    mocks.role = 'ROLE_STUDENT';
    const homeworkNotification = notificationEntity.domain.schema.parse({
      id: 52,
      message: '새 과제가 등록됐어요.',
      category: 'HOMEWORK',
      targetMetadata: { studyRoomId: '7', homeworkId: '19' },
      regDate: '2026-11-28T08:30:00',
      read: false,
    });
    const qnaNotification = notificationEntity.domain.schema.parse({
      id: 53,
      message: '질문에 답변이 달렸어요.',
      category: 'QNA',
      targetMetadata: { studyRoomId: '7', qnaId: '11' },
      regDate: '2026-11-28T08:31:00',
      read: true,
    });
    mocks.notifications.mockReturnValue({
      data: [homeworkNotification, qnaNotification],
      isLoading: false,
      error: null,
    });
    mocks.unread.mockReturnValue({
      data: [homeworkNotification],
      refetch: mocks.refetchUnread,
    });
    const user = userEvent.setup();
    render(<NotificationPopover />);

    expect(screen.getByTestId('notification-icon')).toHaveAttribute(
      'data-has-notifications',
      'true'
    );
    await user.click(screen.getByRole('button', { name: '알림 확인' }));

    expect(await screen.findByText('새 과제가 등록됐어요.')).toBeVisible();
    expect(screen.getByText('질문에 답변이 달렸어요.')).toBeVisible();
    expect(homeworkNotification.targetMetadata).toEqual({
      studyRoomId: '7',
      homeworkId: '19',
    });
    expect(homeworkNotification.targetUrl).toBe('/study-rooms/7/homework/19');

    await user.click(screen.getByTestId('notification-item-52'));

    expect(mocks.markAsRead).toHaveBeenCalledWith([52]);
    expect(mocks.push).toHaveBeenCalledWith('/study-rooms/7/homework/19');
  });

  it('기존 개별 삭제 동작을 보존한다', async () => {
    const user = userEvent.setup();
    render(<NotificationPopover />);

    await user.click(screen.getByRole('button', { name: '알림 확인' }));
    await user.click(await screen.findByRole('button', { name: '알림 삭제' }));

    expect(mocks.deleteNotifications).toHaveBeenCalledWith([41]);
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('알림이 없으면 90일 빈 상태를 표시한다', async () => {
    mocks.notifications.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    mocks.unread.mockReturnValue({
      data: [],
      refetch: mocks.refetchUnread,
    });
    const user = userEvent.setup();
    render(<NotificationPopover />);

    await user.click(screen.getByRole('button', { name: '알림 확인' }));

    expect(
      await screen.findByText('최근 90일 동안 받은 알림이 없어요.')
    ).toBeVisible();
  });
});
