import { isMvpHShellEnabled } from '@/shared/lib/mvp-h-slice';

export type NotificationTargetMetadata = {
  qnaId?: string;
  studyRoomId?: string;
  teachingNoteId?: string;
  homeworkId?: string;
  noticeId?: string;
  messageId?: string;
  articleId?: string;
  inquiryId?: string;
  pageId?: string;
  nodeId?: string;
  pinId?: string;
  solutionNoteId?: string;
} | null;

const pathSegment = (value?: string): string | null => {
  const normalized = value?.trim();
  if (!normalized || /^(undefined|null|nan)$/i.test(normalized)) return null;
  return encodeURIComponent(normalized);
};

/**
 * 오독공 셸 전용 알림 이동 규칙(day.noti).
 * 공지 알림은 스터디룸 공지 탭으로 보낸다.
 * 목적지를 알 수 없으면 null(이동 없음, 죽은 링크를 만들지 않는다).
 */
export const getShellNoticeTarget = (
  category: string,
  metadata: NotificationTargetMetadata
): string | null => {
  if (!isMvpHShellEnabled()) return null;
  if (category !== 'STUDY_ROOM') return null;
  const studyRoomId = pathSegment(metadata?.studyRoomId);
  if (!studyRoomId) return null;
  if (pathSegment(metadata?.noticeId)) {
    return `/study-rooms/${studyRoomId}/notice`;
  }
  if (pathSegment(metadata?.messageId)) return '/dashboard/student';
  return null;
};

/**
 * 알림 카테고리별 실제 화면 목적지를 계산한다.
 * 상세 화면에 필요한 metadata가 모자라면 안전한 목록으로 이동한다.
 */
export const getNotificationTarget = (
  category: string,
  metadata: NotificationTargetMetadata
): string | null => {
  const studyRoomId = pathSegment(metadata?.studyRoomId);

  switch (category) {
    case 'TEACHING_NOTE': {
      const teachingNoteId = pathSegment(metadata?.teachingNoteId);
      if (studyRoomId && teachingNoteId) {
        return `/study-rooms/${studyRoomId}/note/${teachingNoteId}`;
      }
      return studyRoomId
        ? `/study-rooms/${studyRoomId}/note`
        : '/mypage?tab=profile';
    }
    case 'STUDY_ROOM':
      return (
        getShellNoticeTarget(category, metadata) ??
        (studyRoomId
          ? `/study-rooms/${studyRoomId}/note`
          : '/mypage?tab=profile')
      );
    case 'QNA': {
      const qnaId = pathSegment(metadata?.qnaId);
      if (studyRoomId && qnaId) {
        return `/study-rooms/${studyRoomId}/qna/${qnaId}`;
      }
      return studyRoomId
        ? `/study-rooms/${studyRoomId}/qna`
        : '/mypage?tab=profile';
    }
    case 'HOMEWORK': {
      const homeworkId = pathSegment(metadata?.homeworkId);
      if (studyRoomId && homeworkId) {
        return `/study-rooms/${studyRoomId}/homework/${homeworkId}`;
      }
      return studyRoomId
        ? `/study-rooms/${studyRoomId}/homework`
        : '/mypage?tab=profile';
    }
    case 'COLUMN_ARTICLE': {
      const articleId = pathSegment(metadata?.articleId);
      return articleId ? `/community/column/${articleId}` : '/community/column';
    }
    case 'INQUIRY': {
      const inquiryId = pathSegment(metadata?.inquiryId);
      return inquiryId ? `/inquiry/${inquiryId}` : '/mypage';
    }
    case 'PIN_ADDED': {
      const nodeId = pathSegment(metadata?.nodeId);
      if (!nodeId) return '/dashboard/student/unit-notes';

      const query = new URLSearchParams();
      const pageId = metadata?.pageId?.trim();
      const pinId = metadata?.pinId?.trim();
      if (pageId) query.set('page', pageId);
      if (pinId) query.set('pin', pinId);

      const suffix = query.toString();
      return `/dashboard/student/unit-notes/${nodeId}${suffix ? `?${suffix}` : ''}`;
    }
    case 'SOLUTION_COMMENT': {
      const solutionNoteId = pathSegment(metadata?.solutionNoteId);
      return solutionNoteId
        ? `/dashboard/student/solution-notes/${solutionNoteId}`
        : '/dashboard/student';
    }
    case 'NOTICE':
    case 'SYSTEM':
    default:
      return null;
  }
};
