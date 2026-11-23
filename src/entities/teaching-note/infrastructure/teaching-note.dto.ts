import { z } from 'zod';

const lessonInfo = z.object({
  nextLesson: z
    .object({
      at: z.string().nullish(),
      minutes: z.number().nullish(),
      mode: z.string().nullish(),
    })
    .nullish(),
  weekly: z.string().nullish(),
  teacherNote: z.string().nullish(),
  myMemo: z.string().nullish(),
});

const attachProblem = z.object({
  problemId: z.number(),
  position: z.number(),
  autoRegistered: z.object({
    studentCount: z.number(),
    pending: z.boolean(),
    skippedExisting: z.number().nullish(),
  }),
});

const shareLink = z.object({
  url: z.string(),
  token: z.string(),
  expiresAt: z.string(),
});

const shareMeta = z.object({
  title: z.string().nullish(),
  taughtAt: z.string().nullish(),
  teacherName: z.string().nullish(),
  studyRoomName: z.string().nullish(),
  ogImageUrl: z.string().nullish(),
  problemCount: z.number(),
  boardPhotoCount: z.number(),
  homeworkCount: z.number(),
});

const studentReviewSummary = z.object({
  studentId: z.number(),
  activeCount: z.number(),
  dueNow: z.number(),
  graduatedCount: z.number(),
  recentNotes: z.array(
    z.object({
      solutionNoteId: z.number(),
      challengeId: z.number().nullable(),
      title: z.string().nullish(),
      submittedAt: z.string().nullish(),
      isCorrect: z.boolean().nullable(),
      labels: z.array(z.string()),
      stuckReasons: z.array(z.string()),
      versionCount: z.number(),
      thumbUrl: z.string().nullable(),
    })
  ),
  reasonDistribution: z.record(z.string(), z.number()),
  origins: z.record(z.string(), z.number()),
});

const memoSaved = z.unknown();

export const dto = {
  lessonInfo,
  attachProblem,
  shareLink,
  shareMeta,
  studentReviewSummary,
  memoSaved,
};

/** 계약 §1.14: challengeId 또는 snapshot 중 하나 */
const attachProblemRequest = z.object({
  challengeId: z.number().int().positive(),
  solvedTogether: z.boolean(),
  memo: z.string().max(500).nullable(),
});

const lessonInfoRequest = z.object({
  weeklyRule: z.string().max(200),
  nextLessonAt: z.string().nullable(),
  minutes: z.number().int().min(0).nullable(),
  mode: z.string().max(10).nullable(),
  teacherNote: z.string().max(500),
});

export const payload = { attachProblemRequest, lessonInfoRequest };
