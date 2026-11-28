import { domain } from '@/entities/notification/core';
import {
  getNotificationTarget,
  getShellNoticeTarget,
} from '@/entities/notification/core/notification-target';
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

  it('T-NOTI-1 핀 알림은 학생의 해당 노트와 핀으로 이동한다', () => {
    const parsed = domain.schema.parse({
      id: 2,
      message: '선생님이 노트에 핀을 남겼어요',
      category: 'PIN_ADDED',
      targetMetadata: { nodeId: '12', pageId: '9', pinId: '41' },
      regDate: '2026-11-26T21:00:00',
      read: false,
    });

    expect(parsed.targetUrl).toBe(
      '/dashboard/student/unit-notes/12?page=9&pin=41'
    );
    expect(parsed.categoryKorean).toBe('노트 핀');
  });

  it('T-NOTI-1 질문·과제는 방과 대상 id가 있으면 정확한 상세로 간다', () => {
    expect(
      getNotificationTarget('QNA', { studyRoomId: '7', qnaId: '11' })
    ).toBe('/study-rooms/7/qna/11');
    expect(
      getNotificationTarget('HOMEWORK', {
        studyRoomId: '7',
        homeworkId: '13',
      })
    ).toBe('/study-rooms/7/homework/13');
  });

  it('producer metadata가 일부 빠지면 카테고리 목록으로 안전하게 폴백한다', () => {
    expect(
      getNotificationTarget('TEACHING_NOTE', { teachingNoteId: '19' })
    ).toBe('/mypage?tab=profile');
    expect(getNotificationTarget('QNA', { studyRoomId: '7' })).toBe(
      '/study-rooms/7/qna'
    );
    expect(getNotificationTarget('HOMEWORK', null)).toBe('/mypage?tab=profile');
    expect(getNotificationTarget('INQUIRY', null)).toBe('/mypage');
    expect(getNotificationTarget('PIN_ADDED', {})).toBe(
      '/dashboard/student/unit-notes'
    );
  });

  it('비어 있거나 특수문자가 있는 id로 죽은 URL을 만들지 않는다', () => {
    const fallback = getNotificationTarget('TEACHING_NOTE', {
      studyRoomId: '7',
      teachingNoteId: 'undefined',
    });
    const encoded = getNotificationTarget('QNA', {
      studyRoomId: 'room/7',
      qnaId: 'question?11',
    });

    expect(fallback).toBe('/study-rooms/7/note');
    expect(fallback).not.toContain('/undefined');
    expect(encoded).toBe('/study-rooms/room%2F7/qna/question%3F11');
  });

  it('핀 query는 존재하는 값만 인코딩해 전달한다', () => {
    expect(
      getNotificationTarget('PIN_ADDED', {
        nodeId: '12',
        pageId: '9/10',
        pinId: '41?x',
      })
    ).toBe('/dashboard/student/unit-notes/12?page=9%2F10&pin=41%3Fx');
    expect(getNotificationTarget('PIN_ADDED', { nodeId: '12' })).toBe(
      '/dashboard/student/unit-notes/12'
    );
  });
});
