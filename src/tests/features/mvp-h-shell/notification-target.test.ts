import { getShellNoticeTarget } from '@/entities/notification/core/notification-target';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('T-SHL-N 알림 이동(day.noti)', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('스위치가 켜지면 공지 알림은 스터디룸 공지 탭으로 간다', () => {
    vi.stubEnv('NEXT_PUBLIC_MVPH_SHELL', 'on');
    expect(getShellNoticeTarget('NOTICE', { studyRoomId: '7' })).toBe(
      '/study-rooms/7/notice'
    );
  });

  it('스위치가 꺼지면 기존 동작(이동 없음)이다', () => {
    vi.stubEnv('NEXT_PUBLIC_MVPH_SHELL', 'off');
    expect(getShellNoticeTarget('NOTICE', { studyRoomId: '7' })).toBeNull();
  });

  it('스터디룸 id 가 없거나 공지가 아니면 이동하지 않는다(죽은 링크 금지)', () => {
    vi.stubEnv('NEXT_PUBLIC_MVPH_SHELL', 'on');
    expect(getShellNoticeTarget('NOTICE', {})).toBeNull();
    expect(getShellNoticeTarget('NOTICE', null)).toBeNull();
    expect(getShellNoticeTarget('QNA', { studyRoomId: '7' })).toBeNull();
  });
});
