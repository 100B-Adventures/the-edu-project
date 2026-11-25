import { domain } from '@/entities/notification/core';
import { getShellNoticeTarget } from '@/entities/notification/core/notification-target';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('T-SHL-N 알림 이동(day.noti)', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('스위치가 켜지면 공지 알림은 스터디룸 공지 탭으로 간다', () => {
    vi.stubEnv('NEXT_PUBLIC_MVPH_SHELL', 'on');
    expect(
      getShellNoticeTarget('STUDY_ROOM', {
        studyRoomId: '7',
        noticeId: '21',
      })
    ).toBe('/study-rooms/7/notice');
  });

  it('스위치가 꺼지면 기존 동작(이동 없음)이다', () => {
    vi.stubEnv('NEXT_PUBLIC_MVPH_SHELL', 'off');
    expect(
      getShellNoticeTarget('STUDY_ROOM', {
        studyRoomId: '7',
        noticeId: '21',
      })
    ).toBeNull();
  });

  it('스터디룸 id 가 없거나 공지가 아니면 이동하지 않는다(죽은 링크 금지)', () => {
    vi.stubEnv('NEXT_PUBLIC_MVPH_SHELL', 'on');
    expect(getShellNoticeTarget('STUDY_ROOM', {})).toBeNull();
    expect(getShellNoticeTarget('STUDY_ROOM', null)).toBeNull();
    expect(getShellNoticeTarget('QNA', { studyRoomId: '7' })).toBeNull();
  });

  it('서버의 STUDY_ROOM messageId 알림은 학생 홈의 받은 것으로 간다', () => {
    vi.stubEnv('NEXT_PUBLIC_MVPH_SHELL', 'on');
    expect(
      getShellNoticeTarget('STUDY_ROOM', {
        studyRoomId: '7',
        messageId: '33',
      })
    ).toBe('/dashboard/student');
  });

  it('실제 알림 DTO 파싱 후에도 messageId 목적지와 라벨을 보존한다', () => {
    vi.stubEnv('NEXT_PUBLIC_MVPH_SHELL', 'on');
    const parsed = domain.schema.parse({
      id: 1,
      message: '선생님이 한마디 보냈어요',
      category: 'STUDY_ROOM',
      targetMetadata: { studyRoomId: '7', messageId: '33' },
      regDate: '2026-11-25T20:00:00',
      read: false,
    });

    expect(parsed.targetUrl).toBe('/dashboard/student');
    expect(parsed.categoryKorean).toBe('선생님 메시지');
    expect(parsed.targetMetadata?.messageId).toBe('33');
  });
});
