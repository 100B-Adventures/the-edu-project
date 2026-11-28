import { getNotificationTarget } from '@/entities/notification/core/notification-target';
import { dto } from '@/entities/notification/infrastructure';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { z } from 'zod';

/* ─────────────────────────────────────────────────────
 * category -> 한글 변환 매핑
 * ────────────────────────────────────────────────────*/
const CATEGORY_TO_KOREAN: Record<string, string> = {
  SYSTEM: '공지사항',
  HOMEWORK: '과제',
  TEACHING_NOTE: '수업노트',
  STUDY_ROOM: '스터디룸 초대',
  QNA: '질문',
  NOTICE: '공지',
  COLUMN_ARTICLE: '칼럼',
  INQUIRY: '문의',
  PIN_ADDED: '노트 핀',
  SOLUTION_COMMENT: '풀이 댓글',
};

const getCategoryKorean = (
  category: string,
  metadata: { noticeId?: string; messageId?: string } | null
): string => {
  if (category === 'STUDY_ROOM' && metadata?.noticeId) return '공지';
  if (category === 'STUDY_ROOM' && metadata?.messageId) return '선생님 메시지';
  return (
    CATEGORY_TO_KOREAN[category as keyof typeof CATEGORY_TO_KOREAN] || '기타'
  );
};

/* ─────────────────────────────────────────────────────
 * DTO 스키마를 Domain 스키마로 변환
 * - regDate를 Date 객체로 변환
 * - nullable 처리
 * ────────────────────────────────────────────────────*/
const NotificationShape = dto.schema
  .partial()
  .required({
    id: true,
    message: true,
    category: true,
    targetMetadata: true,
    read: true,
  })
  .extend({
    regDate: z.preprocess((val) => {
      if (!val) return new Date();
      return typeof val === 'string' ? new Date(val) : val;
    }, z.date()),
  });

/* ─────────────────────────────────────────────────────
 * Domain 스키마 (비즈니스 로직 포함)
 * - categoryKorean: 카테고리 한글 변환
 * - targetUrl: 카테고리별 URL 생성
 * - relativeTime: 상대 시간 표시
 * - isRead: 읽음 상태
 * ────────────────────────────────────────────────────*/
const NotificationSchema = NotificationShape.transform((notification) => ({
  ...notification,
  categoryKorean: getCategoryKorean(
    notification.category,
    notification.targetMetadata
  ),
  targetUrl: getNotificationTarget(
    notification.category,
    notification.targetMetadata
  ),
  relativeTime: formatDistanceToNow(notification.regDate, {
    addSuffix: true,
    locale: ko,
  }),
  isRead: notification.read,
}));

export const domain = {
  schema: NotificationSchema,
};
