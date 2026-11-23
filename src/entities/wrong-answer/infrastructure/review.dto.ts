import { z } from 'zod';

const origin = z.object({ kind: z.string(), label: z.string().nullish() });

const questItem = z.object({
  position: z.number(),
  provider: z.string().nullish(),
  wrongAnswerId: z.number().nullable(),
  challengeId: z.number().nullable(),
  title: z.string().nullish(),
  dueLabel: z.string().nullish(),
  reason: z.string().nullish(),
  difficulty: z.string().nullish(),
  solvedStatus: z.string().nullish(),
  kind: z.string().nullish(),
  badge: z.string().nullish(),
  origin: origin.nullish(),
});

const overview = z.object({
  today: z.string(),
  reviewDay: z.number(),
  me: z.object({
    level: z.number(),
    exp: z.number(),
    expToNext: z.number(),
    source: z.string().nullish(),
  }),
  quest: z
    .object({ items: z.array(questItem), expReward: z.number() })
    .nullish(),
  curve: z
    .object({
      buckets: z.array(
        z.object({ intervalDays: z.number(), count: z.number() })
      ),
      dueNow: z.number(),
      soonForget: z.object({ tomorrow: z.number(), dayAfter: z.number() }),
    })
    .nullish(),
  situation: z
    .object({
      total: z.number(),
      byReason: z.record(z.string(), z.number()),
    })
    .nullish(),
  unit: z
    .array(
      z.object({
        treeNodeId: z.number().nullable(),
        name: z.string(),
        count: z.number(),
        dueNow: z.number(),
        byReviewCount: z.array(z.number()),
      })
    )
    .nullish(),
});

const card = z.object({
  wrongAnswerId: z.number(),
  challengeId: z.number().nullable(),
  title: z.string().nullish(),
  unitName: z.string().nullish(),
  thumbUrl: z.string().nullable(),
  reasons: z.array(z.string()),
  reasonText: z.string().nullish(),
  dueBadge: z.object({ kind: z.string(), label: z.string() }),
  reviewCount: z.number(),
  maxReviews: z.number(),
  lastReviewedAt: z.string().nullish(),
  origin: origin.nullish(),
});

const cards = z.object({ items: z.array(card), totalCount: z.number() });

const importResponse = z.object({
  created: z.array(
    z.object({
      wrongAnswerId: z.number(),
      importChannel: z.string(),
      nextReviewAt: z.string().nullish(),
    })
  ),
  skippedDuplicates: z.array(z.number()),
});

const randomProblem = z.object({
  wrongAnswerId: z.number(),
  challengeId: z.number().nullable(),
});

const blankSession = z.object({
  blankSessionId: z.number(),
  startedAt: z.string().nullish(),
  dueNow: z.boolean(),
});

const blankRetryResponse = z.object({
  reviewNo: z.number(),
  reviewCount: z.number(),
  graduated: z.boolean(),
  nextReviewAt: z.string().nullish(),
  intervalDays: z.number().nullish(),
  schedulerVersion: z.number(),
  countedAsReview: z.boolean(),
  reward: z.object({
    granted: z.boolean(),
    action: z.string().nullish(),
    exp: z.number().nullish(),
    reason: z.string().nullish(),
  }),
  handwriting: z
    .object({ assetId: z.number().nullable(), strokesPending: z.boolean() })
    .nullish(),
});

const archive = z.object({ status: z.string() });

const handwritingRef = z.object({
  pngMediaId: z.number().int().positive(),
  strokesMediaId: z.number().int().positive().nullable(),
  strokesDeferred: z.boolean(),
  strokeCount: z.number().int().min(0),
  strokeBytes: z.number().int().min(0),
  strokesSha256: z.string().nullable(),
  pngSha256: z.string().length(64),
  schemaVersion: z.number().int(),
  layoutWidth: z.number().int(),
  layoutHeight: z.number().int(),
});

/** 계약 §1.9 + 구현 이탈: 답 칸이 있는 문제는 selectedAnswer 필수, 없는 문제는 selfJudgement (빌드 로그 v1.2.0 §9) */
const blankRetryRequest = z.object({
  blankSessionId: z.number().int().positive(),
  selfJudgement: z.enum(['CORRECT', 'WRONG']).nullable(),
  selectedAnswer: z.string().nullable(),
  elapsedSeconds: z.number().int().min(0),
  handwriting: handwritingRef,
  stuckReasons: z.array(z.string()).nullable(),
});

const importRequest = z.discriminatedUnion('channel', [
  z.object({
    channel: z.literal('PHOTO'),
    photoMediaIds: z.array(z.number().int().positive()).min(1).max(4),
    photoSha256: z.array(z.string()).optional(),
    treeNodeId: z.number().nullable().optional(),
  }),
  z.object({
    channel: z.literal('TEXTBOOK'),
    textbook: z.object({
      title: z.string().min(1),
      page: z.number().int().positive().nullable(),
      number: z.string().min(1),
    }),
    treeNodeId: z.number().nullable().optional(),
  }),
  z.object({
    channel: z.literal('SOLVED_TODAY'),
    challengeAttemptIds: z.array(z.number().int().positive()).min(1),
    treeNodeId: z.number().nullable().optional(),
  }),
]);

export const reviewDto = {
  overview,
  cards,
  importResponse,
  randomProblem,
  blankSession,
  blankRetryResponse,
  archive,
};

export const reviewPayload = { blankRetryRequest, importRequest };
