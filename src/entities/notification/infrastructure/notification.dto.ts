import { z } from 'zod';

const NotificationCategorySchema = z.enum([
  'ALL',
  'SYSTEM',
  'HOMEWORK',
  'TEACHING_NOTE',
  'STUDY_ROOM',
  'QNA',
  'NOTICE',
  'COLUMN_ARTICLE',
  'INQUIRY',
  'PIN_ADDED',
  'SOLUTION_COMMENT',
]);

/**
 * targetMetadata: 카테고리별 메타데이터
 * - QNA: qnaId, studyRoomId
 * - STUDY_ROOM: studyRoomId + noticeId 또는 messageId
 * - TEACHING_NOTE: teachingNoteId, studyRoomId (legacy payload는 studyRoomId 생략 가능)
 * - HOMEWORK: homeworkId, studyRoomId
 * - COLUMN_ARTICLE: articleId, title
 * - INQUIRY: inquiryId, title
 * TODO
 * - SYSTEM: noticeId (예정)
 */
const TargetMetadataSchema = z.object({
  qnaId: z.string().optional(),
  studyRoomId: z.string().optional(),
  teachingNoteId: z.string().optional(),
  homeworkId: z.string().optional(),
  noticeId: z.string().optional(),
  messageId: z.string().optional(),
  articleId: z.string().optional(),
  inquiryId: z.string().optional(),
  title: z.string().optional(),
  pageId: z.string().optional(),
  nodeId: z.string().optional(),
  pinId: z.string().optional(),
  solutionNoteId: z.string().optional(),
});

/* ─────────────────────────────────────────────────────
 * api 응답(DTO 객체) - 알림
 * ────────────────────────────────────────────────────*/
const NotificationDtoSchema = z.object({
  id: z.number().int().nonnegative(),
  message: z.string(),
  category: NotificationCategorySchema,
  targetMetadata: TargetMetadataSchema.nullable(),
  regDate: z.string().nullable(),
  read: z.boolean(),
});

/* ─────────────────────────────────────────────────────
 * api 응답(DTO 객체) - 알림 수신 설정
 * ────────────────────────────────────────────────────*/
const NotificationSettingDtoSchema = z.object({
  category: NotificationCategorySchema,
  label: z.string(),
  enabled: z.boolean(),
});

/* ─────────────────────────────────────────────────────
 * api 응답(DTO 객체) - 마케팅 수신 동의 여부
 * ────────────────────────────────────────────────────*/
const MarketingConsentDtoSchema = z.boolean();

export const dto = {
  schema: NotificationDtoSchema,
  arraySchema: z.array(NotificationDtoSchema),
  category: NotificationCategorySchema,
  setting: NotificationSettingDtoSchema,
  settingArray: z.array(NotificationSettingDtoSchema),
  marketingConsent: MarketingConsentDtoSchema,
};
