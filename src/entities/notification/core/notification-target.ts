import { isMvpHShellEnabled } from '@/shared/lib/mvp-h-slice';

type NoticeTargetMetadata = {
  studyRoomId?: string;
  noticeId?: string;
  messageId?: string;
} | null;

/**
 * 오독공 셸 전용 알림 이동 규칙(day.noti).
 * 공지 알림은 스터디룸 공지 탭으로 보낸다.
 * 목적지를 알 수 없으면 null(이동 없음, 죽은 링크를 만들지 않는다).
 */
export const getShellNoticeTarget = (
  category: string,
  metadata: NoticeTargetMetadata
): string | null => {
  if (!isMvpHShellEnabled()) return null;
  if (category !== 'STUDY_ROOM') return null;
  if (!metadata?.studyRoomId) return null;
  if (metadata.noticeId) return `/study-rooms/${metadata.studyRoomId}/notice`;
  if (metadata.messageId) return '/dashboard/student';
  return null;
};
