import { repository } from '@/entities/notification';
import { api } from '@/shared/api';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('S13 알림 실 API 계약', () => {
  afterEach(() => vi.restoreAllMocks());

  it('목록 응답을 정확한 대상으로 해석하고 같은 id를 읽음 처리한다', async () => {
    const get = vi.spyOn(api.private, 'get').mockResolvedValue({
      status: 200,
      message: '성공',
      data: [
        {
          id: 41,
          message: '질문에 답변이 달렸어요.',
          category: 'QNA',
          targetMetadata: { studyRoomId: '7', qnaId: '11' },
          regDate: '2026-11-28T07:00:00',
          read: false,
        },
      ],
    });
    const patch = vi
      .spyOn(api.private, 'patch')
      .mockResolvedValue({ status: 200, message: '성공', data: null });

    const notifications = await repository.notification.getList();
    const [notification] = notifications;
    expect(notification).toBeDefined();
    if (!notification) throw new Error('알림 API 응답이 비어 있습니다.');
    await repository.notification.markAsRead([notification.id]);

    expect(get).toHaveBeenCalledWith('/notification/all');
    expect(notification).toMatchObject({
      id: 41,
      isRead: false,
      targetUrl: '/study-rooms/7/qna/11',
    });
    expect(patch).toHaveBeenCalledWith('/notification/read', {
      notificationIds: [41],
    });
  });

  it('빈 목록 응답은 가짜 알림을 만들지 않는다', async () => {
    vi.spyOn(api.private, 'get').mockResolvedValue({
      status: 200,
      message: '성공',
      data: [],
    });

    await expect(repository.notification.getList()).resolves.toEqual([]);
  });
});
