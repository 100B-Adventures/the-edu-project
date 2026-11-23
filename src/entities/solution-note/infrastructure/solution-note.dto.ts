import { z } from 'zod';

const rewardResult = z.object({
  granted: z.boolean(),
  action: z.string().nullish(),
  exp: z.number().nullish(),
  reason: z.string().nullish(),
  countsTowardDailyCap: z.boolean().nullish(),
});

const handwritingResult = z.object({
  assetId: z.number().nullable(),
  strokesPending: z.boolean(),
});

const diffMark = z.object({ y0: z.number(), y1: z.number() });

const wrongAnswerRef = z.object({
  id: z.number().nullish(),
  registered: z.boolean(),
  kind: z.string().nullish(),
  reason: z.string().nullish(),
  nextReviewAt: z.string().nullish(),
  schedulerVersion: z.number().nullish(),
});

const createResponse = z.object({
  solutionNoteId: z.number(),
  versionNo: z.number(),
  isCorrect: z.boolean().nullable(),
  judgeSource: z.string().nullish(),
  labels: z.array(z.string()),
  preselectedStuckReasons: z.array(z.string()),
  handwriting: handwritingResult,
  reward: rewardResult,
  wrongAnswer: wrongAnswerRef.nullish(),
  stuckReasonOptions: z.array(z.string()),
});

const versionSummary = z.object({
  versionNo: z.number(),
  kind: z.string(),
  createdAt: z.string(),
  strokeCount: z.number(),
  pngUrl: z.string().nullable(),
  strokesPending: z.boolean(),
  diffMarks: z.array(diffMark),
});

const detail = z.object({
  solutionNoteId: z.number(),
  challengeId: z.number().nullable(),
  challengeAttemptId: z.number().nullable(),
  isCorrect: z.boolean().nullable(),
  judgeSource: z.string().nullish(),
  elapsedSeconds: z.number(),
  labels: z.array(z.string()),
  stuckReasons: z.array(z.string()),
  explanation: z.object({
    mode: z.string().nullish(),
    viewedAt: z.string().nullish(),
  }),
  currentVersionNo: z.number(),
  versions: z.array(versionSummary),
  wrongAnswer: z
    .object({
      id: z.number(),
      reviewCount: z.number(),
      nextReviewAt: z.string().nullish(),
      status: z.string(),
    })
    .nullish(),
});

const explanation = z.object({
  solutionNoteId: z.number(),
  steps: z.array(
    z.object({
      no: z.number(),
      text: z.string(),
      tag: z.string().nullish(),
    })
  ),
  fullText: z.string().nullish(),
  viewedAt: z.string().nullish(),
  cost: z.object({ points: z.number(), reason: z.string().nullish() }),
});

const version = z.object({
  versionNo: z.number(),
  kind: z.string(),
  pngUrl: z.string().nullable(),
  strokesUrl: z.string().nullable(),
  strokesSha256: z.string().nullish(),
  schemaVersion: z.number().nullish(),
  layoutWidth: z.number().nullish(),
  layoutHeight: z.number().nullish(),
  diffMarks: z.array(diffMark),
});

const reviseResponse = z.object({
  versionNo: z.number(),
  changed: z.boolean(),
  reward: rewardResult,
  handwriting: handwritingResult,
});

const stuckReasonResponse = z.object({
  reasons: z.array(z.string()),
  wrongAnswerId: z.number().nullish(),
  suggestImport: z.boolean(),
});

const history = z.object({
  items: z.array(
    z.object({
      solutionNoteId: z.number(),
      submittedAt: z.string().nullish(),
      isCorrect: z.boolean().nullable(),
      labels: z.array(z.string()),
      thumbUrl: z.string().nullable(),
      versionCount: z.number(),
    })
  ),
  totalCount: z.number(),
});

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

const createRequest = z.object({
  challengeAttemptId: z.number().int().positive(),
  elapsedSeconds: z.number().int().min(0),
  handwriting: handwritingRef,
  confirmEmpty: z.boolean(),
  selfJudgement: z.enum(['CORRECT', 'WRONG']).nullable(),
});

const reviseRequest = z.object({
  handwriting: handwritingRef,
  diffMarks: z.array(diffMark),
  elapsedSeconds: z.number().int().min(0),
  baseVersionNo: z.number().int().positive(),
});

export const dto = {
  createResponse,
  detail,
  explanation,
  version,
  reviseResponse,
  stuckReasonResponse,
  history,
};

export const payload = { createRequest, reviseRequest };
