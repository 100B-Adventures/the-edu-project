import { z } from 'zod';

/* ─────────────────────────────────────────────────────
 * 진도 상태
 * ────────────────────────────────────────────────────*/
const ProgressStatusSchema = z.enum([
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
]);

/* ─────────────────────────────────────────────────────
 * 코스 목록 아이템 Domain
 *  GET /api/public/courses
 * ────────────────────────────────────────────────────*/
const CourseListItemSchema = z.object({
  courseId: z.number(),
  title: z.string(),
  subject: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  freeLessonCount: z.number(),
  isPublished: z.boolean(),
});

/* ─────────────────────────────────────────────────────
 * 코스 상세 Domain
 *  GET /api/public/courses/{id}
 * ────────────────────────────────────────────────────*/
const CourseDetailSchema = CourseListItemSchema.extend({
  lessonCount: z.number(),
});

/* ─────────────────────────────────────────────────────
 * 차시에 연결된 오픈챌린지 문제 Domain
 *  잠긴 차시는 빈 배열([]).
 * ────────────────────────────────────────────────────*/
const LessonProblemSchema = z.object({
  challengeId: z.string(),
  title: z.string(),
  difficulty: z.enum(['TOP', 'HIGH', 'MID', 'LOW']),
  subject: z.enum(['MATH', 'KOREAN', 'ENGLISH', 'SCIENCE']),
  orderIndex: z.number(),
});

/* ─────────────────────────────────────────────────────
 * 차시(맛보기 게이팅 반영) Domain
 *  GET /api/common/courses/{id}/lessons
 *  - isLocked=true 면 contentRef=null (잠금) + problems=[]
 * ────────────────────────────────────────────────────*/
const LessonSchema = z.object({
  lessonId: z.number(),
  title: z.string(),
  orderIndex: z.number(),
  isLocked: z.boolean(),
  contentRef: z.string().nullable(),
  progressStatus: ProgressStatusSchema,
  problems: z.array(LessonProblemSchema).default([]),
  /** 커리큘럼 단원 그룹명. 없으면 null(프론트가 "기타"로 묶음). */
  unitName: z.string().nullable(),
  /** 강의 재생시간(초). 없으면 null. */
  durationSec: z.number().nullable(),
  /** 강의 썸네일 URL. 없으면 null(프론트가 placeholder 렌더). */
  thumbnailUrl: z.string().nullable(),
});

/* ─────────────────────────────────────────────────────
 * 수강 신청 결과 Domain
 *  POST /api/common/courses/{id}/enroll
 * ────────────────────────────────────────────────────*/
const EnrollResultSchema = z.object({
  result: z.enum(['ENROLLED', 'PENDING_PAYMENT']),
  orderId: z.number().nullable(),
});

/* ─────────────────────────────────────────────────────
 * 진도 업데이트 결과 Domain
 *  POST /api/common/lessons/{id}/progress
 * ────────────────────────────────────────────────────*/
const ProgressResultSchema = z.object({
  progressId: z.number(),
  lessonId: z.number(),
  status: ProgressStatusSchema,
  completedAt: z.string().nullable(),
});

/* ─────────────────────────────────────────────────────
 * 3티어 상품 Domain (MVP-F api-contract-v2 ①)
 *  GET /api/public/courses/{courseId}/products
 * ────────────────────────────────────────────────────*/
const PlanTypeSchema = z.enum(['SELF_PACED', 'MANAGED', 'PREMIUM_1ON1']);

const CourseProductSchema = z.object({
  productId: z.number(),
  planType: PlanTypeSchema,
  // 백엔드 미제공 — planType 에서 라벨 생성(TIER_COPY). optional.
  planLabel: z.string().optional(),
  price: z.number(),
  refundGuaranteed: z.boolean(),
  reviewManaged: z.boolean(),
  best: z.boolean(),
});

/* ─────────────────────────────────────────────────────
 * 주문 생성 결과 Domain (api-contract-v2 ②)
 *  POST /api/common/course-orders
 *  실결제(confirm)는 PG 미정(⛔ R-A)이라 프론트는 스텁 — 주문 생성까지.
 * ────────────────────────────────────────────────────*/
const CourseOrderCreateResultSchema = z.object({
  orderId: z.number(),
  orderKey: z.string(),
  amount: z.number(),
  currency: z.literal('KRW'),
  courseTitle: z.string(),
  // 백엔드 CourseOrderCreateResponse 는 planType 을 주고 planLabel 은 없다.
  planType: PlanTypeSchema.optional(),
  planLabel: z.string().optional(),
  pgProvider: z.string(),
  // PG 실연동 전(stub)이라 백엔드가 아직 내려주지 않는다 → optional.
  pgClientKey: z.string().optional(),
  customerName: z.string().optional(),
});

/* ─────────────────────────────────────────────────────
 * Day 유형 Domain (frd-v2 §3.2)
 * ────────────────────────────────────────────────────*/
const DayTypeSchema = z.enum([
  'LECTURE_NOTE',
  'PROBLEM_SET',
  'REVIEW',
  'REMEASURE',
]);

/* ─────────────────────────────────────────────────────
 * 영상 세그먼트 Domain (api-contract-v2 ⑦)
 *  GET /api/common/lessons/{lessonId}/segments
 * ────────────────────────────────────────────────────*/
const LessonSegmentSchema = z.object({
  segmentId: z.number(),
  orderIndex: z.number(),
  title: z.string(),
  durationSec: z.number(),
  hasCheckpoint: z.boolean(),
  cleared: z.boolean(),
  lastPositionSec: z.number(),
});

const LessonSegmentGroupSchema = z.object({
  lessonId: z.number(),
  dayType: DayTypeSchema,
  requireSegmentClear: z.boolean(),
  noteSlotUnlocked: z.boolean(),
  segments: z.array(LessonSegmentSchema),
});

/* ─────────────────────────────────────────────────────
 * 재생 티켓 Domain (api-contract-v2 ⑧)
 * ────────────────────────────────────────────────────*/
const PlaybackTicketSchema = z.object({
  playbackUrl: z.string(),
  expiresAt: z.string(),
  provider: z.string(),
  startSec: z.number(),
  endSec: z.number(),
});

/* ─────────────────────────────────────────────────────
 * 체크포인트 제출 결과 Domain (api-contract-v2 ⑨)
 *  능동 행위 = 보상의 유일한 근거. 보상은 이 결과에만 걸린다.
 * ────────────────────────────────────────────────────*/
const CheckpointResultSchema = z.object({
  correct: z.boolean(),
  attemptNo: z.number(),
  clearedAt: z.string().nullable(),
  allSegmentsCleared: z.boolean(),
  noteSlotUnlocked: z.boolean(),
  nextSegmentId: z.number().nullable(),
});

export const domain = {
  progressStatus: ProgressStatusSchema,
  listItem: CourseListItemSchema,
  detail: CourseDetailSchema,
  lesson: LessonSchema,
  lessonProblem: LessonProblemSchema,
  enrollResult: EnrollResultSchema,
  progressResult: ProgressResultSchema,
  planType: PlanTypeSchema,
  courseProduct: CourseProductSchema,
  orderCreateResult: CourseOrderCreateResultSchema,
  dayType: DayTypeSchema,
  lessonSegment: LessonSegmentSchema,
  lessonSegmentGroup: LessonSegmentGroupSchema,
  playbackTicket: PlaybackTicketSchema,
  checkpointResult: CheckpointResultSchema,
};
