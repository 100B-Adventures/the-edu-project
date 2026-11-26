import { z } from 'zod';

/* ─────────────────────────────────────────────────────
 * 코스 목록 / 상세 DTO
 *  (백엔드 isPublished 직렬화: Lombok getter `isPublished` → `published`)
 * ────────────────────────────────────────────────────*/
const PublishedSchema = z
  .union([z.boolean(), z.undefined()])
  .transform((v) => v ?? false);

const CourseListItemDtoSchema = z
  .object({
    courseId: z.number(),
    title: z.string(),
    subject: z.string(),
    description: z.string().nullable().optional(),
    price: z.number().optional().default(0),
    freeLessonCount: z.number().optional().default(0),
    isPublished: z.boolean().optional(),
    published: z.boolean().optional(),
  })
  .transform((raw) => ({
    courseId: raw.courseId,
    title: raw.title,
    subject: raw.subject,
    description: raw.description ?? null,
    price: raw.price,
    freeLessonCount: raw.freeLessonCount,
    isPublished: PublishedSchema.parse(raw.isPublished ?? raw.published),
  }));

const CourseDetailDtoSchema = z
  .object({
    courseId: z.number(),
    title: z.string(),
    subject: z.string(),
    description: z.string().nullable().optional(),
    price: z.number().optional().default(0),
    freeLessonCount: z.number().optional().default(0),
    isPublished: z.boolean().optional(),
    published: z.boolean().optional(),
    lessonCount: z.number().optional().default(0),
  })
  .transform((raw) => ({
    courseId: raw.courseId,
    title: raw.title,
    subject: raw.subject,
    description: raw.description ?? null,
    price: raw.price,
    freeLessonCount: raw.freeLessonCount,
    isPublished: PublishedSchema.parse(raw.isPublished ?? raw.published),
    lessonCount: raw.lessonCount,
  }));

/* ─────────────────────────────────────────────────────
 * 코스 목록 페이지네이션 DTO (PageResponse)
 * ────────────────────────────────────────────────────*/
const CoursePageDtoSchema = z.object({
  content: z.array(z.unknown()),
  hasNext: z.boolean(),
});

/* ─────────────────────────────────────────────────────
 * 차시 연결 문제 정규화 helper
 *  백엔드 난이도/과목 직렬화 케이스(대/소문자·한글)를 도메인 enum으로 흡수.
 * ────────────────────────────────────────────────────*/
const toProblemDifficulty = (value: string): 'TOP' | 'HIGH' | 'MID' | 'LOW' => {
  switch (value.toUpperCase()) {
    case 'TOP':
    case 'HIGHEST':
    case '최상':
      return 'TOP';
    case 'HIGH':
    case '상':
      return 'HIGH';
    case 'LOW':
    case '하':
      return 'LOW';
    default:
      return 'MID';
  }
};

const toProblemSubject = (
  value: string
): 'MATH' | 'KOREAN' | 'ENGLISH' | 'SCIENCE' => {
  switch (value.toLowerCase()) {
    case 'korean':
    case '국어':
      return 'KOREAN';
    case 'english':
    case '영어':
      return 'ENGLISH';
    case 'science':
    case '탐구':
    case '과학':
      return 'SCIENCE';
    default:
      return 'MATH';
  }
};

/* ─────────────────────────────────────────────────────
 * 차시에 연결된 오픈챌린지 문제 DTO
 *  잠긴(locked) 차시는 백엔드가 빈 배열을 내려준다.
 * ────────────────────────────────────────────────────*/
const LessonProblemDtoSchema = z
  .object({
    challengeId: z.union([z.string(), z.number()]).transform(String),
    title: z.string().optional().default('오픈챌린지 문제'),
    difficulty: z.string().optional().default('MID'),
    subject: z.string().optional().default('MATH'),
    orderIndex: z.number().optional().default(0),
  })
  .transform((raw) => ({
    challengeId: raw.challengeId,
    title: raw.title,
    difficulty: toProblemDifficulty(raw.difficulty),
    subject: toProblemSubject(raw.subject),
    orderIndex: raw.orderIndex,
  }));

/* ─────────────────────────────────────────────────────
 * 차시(게이팅) DTO (LessonWithGatingResponse)
 * ────────────────────────────────────────────────────*/
const LessonDtoSchema = z
  .object({
    lessonId: z.number(),
    title: z.string(),
    orderIndex: z.number(),
    isLocked: z.boolean().optional(),
    locked: z.boolean().optional(),
    contentRef: z.string().nullable().optional(),
    progressStatus: z
      .enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'])
      .optional()
      .default('NOT_STARTED'),
    problems: z.array(LessonProblemDtoSchema).optional().default([]),
    // 커리큘럼 확장 필드(단원·재생시간·썸네일) — 구 백엔드/시드 데이터엔 없을 수 있어
    // 전부 optional. 없으면 프론트가 "기타" 그룹·placeholder 썸네일로 폴백한다.
    unitName: z.string().nullable().optional(),
    durationSec: z.number().nullable().optional(),
    thumbnailUrl: z.string().nullable().optional(),
  })
  .transform((raw) => ({
    lessonId: raw.lessonId,
    title: raw.title,
    orderIndex: raw.orderIndex,
    isLocked: raw.isLocked ?? raw.locked ?? false,
    contentRef: raw.contentRef ?? null,
    progressStatus: raw.progressStatus,
    problems: raw.problems,
    unitName: raw.unitName ?? null,
    durationSec: raw.durationSec ?? null,
    thumbnailUrl: raw.thumbnailUrl ?? null,
  }));

/* ─────────────────────────────────────────────────────
 * 수강 신청 / 진도 DTO
 * ────────────────────────────────────────────────────*/
const EnrollResultDtoSchema = z.object({
  result: z.enum(['ENROLLED', 'PENDING_PAYMENT']),
  orderId: z.number().nullable().optional(),
});

const ProgressResultDtoSchema = z.object({
  progressId: z.number(),
  lessonId: z.number(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']),
  completedAt: z.string().nullable().optional(),
});

/* ─────────────────────────────────────────────────────
 * 3티어 상품 DTO (api-contract-v2 ①)
 * ────────────────────────────────────────────────────*/
const CourseProductDtoSchema = z.object({
  productId: z.number(),
  planType: z.enum(['SELF_PACED', 'MANAGED', 'PREMIUM_1ON1']),
  // 백엔드 상품 응답에 planLabel 이 없다(planType 만 내려줌). 화면 라벨은
  // TIER_COPY/planTypeLabel 로 planType 에서 생성하므로 optional 로 둔다.
  // (필수로 두면 parse throw → tier 섹션 return null → 3티어가 화면에 안 뜸.)
  planLabel: z.string().optional(),
  price: z.number(),
  refundGuaranteed: z.boolean().optional().default(false),
  reviewManaged: z.boolean().optional().default(false),
  best: z.boolean().optional().default(false),
});

/* ─────────────────────────────────────────────────────
 * 주문 생성 결과 DTO (api-contract-v2 ②)
 * ────────────────────────────────────────────────────*/
const CourseOrderCreateResultDtoSchema = z.object({
  orderId: z.number(),
  orderKey: z.string(),
  amount: z.number(),
  courseTitle: z.string(),
  // 백엔드는 planType 을 준다(planLabel 없음). PG 실연동 전(stub)이라
  // pgClientKey·customerName 도 미제공 → optional 로 두어 파싱 실패를 막는다.
  // (필수로 두면 parse throw → "주문 생성에 실패" 로 구매가 아예 막힌다.)
  planType: z.enum(['SELF_PACED', 'MANAGED', 'PREMIUM_1ON1']).optional(),
  planLabel: z.string().optional(),
  pgProvider: z.string(),
  pgClientKey: z.string().optional(),
  customerName: z.string().optional(),
});

/* ─────────────────────────────────────────────────────
 * 영상 세그먼트 DTO (api-contract-v2 ⑦)
 * ────────────────────────────────────────────────────*/
const LessonSegmentDtoSchema = z.object({
  segmentId: z.number(),
  orderIndex: z.number(),
  title: z.string(),
  durationSec: z.number().optional().default(0),
  hasCheckpoint: z.boolean().optional().default(false),
  cleared: z.boolean().optional().default(false),
  lastPositionSec: z.number().optional().default(0),
});

const LessonSegmentGroupDtoSchema = z.object({
  lessonId: z.number(),
  dayType: z
    .enum(['LECTURE_NOTE', 'PROBLEM_SET', 'REVIEW', 'REMEASURE'])
    .optional()
    .default('LECTURE_NOTE'),
  requireSegmentClear: z.boolean().optional().default(false),
  noteSlotUnlocked: z.boolean().optional().default(false),
  segments: z.array(LessonSegmentDtoSchema).optional().default([]),
});

/* ─────────────────────────────────────────────────────
 * 체크포인트 제출 결과 DTO (api-contract-v2 ⑨)
 * ────────────────────────────────────────────────────*/
const CheckpointResultDtoSchema = z.object({
  correct: z.boolean(),
  attemptNo: z.number().optional().default(1),
  clearedAt: z.string().nullable().optional(),
  allSegmentsCleared: z.boolean().optional().default(false),
  noteSlotUnlocked: z.boolean().optional().default(false),
  nextSegmentId: z.number().nullable().optional(),
});

export const dto = {
  listItem: CourseListItemDtoSchema,
  detail: CourseDetailDtoSchema,
  page: CoursePageDtoSchema,
  lesson: LessonDtoSchema,
  enrollResult: EnrollResultDtoSchema,
  progressResult: ProgressResultDtoSchema,
  courseProduct: CourseProductDtoSchema,
  orderCreateResult: CourseOrderCreateResultDtoSchema,
  lessonSegmentGroup: LessonSegmentGroupDtoSchema,
  checkpointResult: CheckpointResultDtoSchema,
};

/* ─────────────────────────────────────────────────────
 * Payload
 * ────────────────────────────────────────────────────*/
const UpdateProgressPayloadSchema = z.object({
  status: z.enum(['IN_PROGRESS', 'COMPLETED']),
});

/* 주문 생성 요청 (api-contract-v2 ②) — studentId null=본인 수강 */
const CreateCourseOrderPayloadSchema = z.object({
  courseId: z.number(),
  productId: z.number(),
  studentId: z.number().nullable().optional(),
  shareCode: z.string().max(64).optional(),
  levelTestToken: z.string().max(64).optional(),
});

/* 체크포인트 제출 요청 (api-contract-v2 ⑨) */
const SubmitCheckpointPayloadSchema = z.object({
  enrollmentId: z.number(),
  choice: z.number(),
});

/* 이어보기 위치 저장 요청 (api-contract-v2 ⑩) — 보상·진도 무관 */
const SaveWatchPositionPayloadSchema = z.object({
  enrollmentId: z.number(),
  lastPositionSec: z.number(),
});

export const payload = {
  updateProgress: UpdateProgressPayloadSchema,
  createCourseOrder: CreateCourseOrderPayloadSchema,
  submitCheckpoint: SubmitCheckpointPayloadSchema,
  saveWatchPosition: SaveWatchPositionPayloadSchema,
};
