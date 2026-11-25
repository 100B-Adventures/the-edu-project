import { z } from 'zod';

/** mvp-h shell 조각 응답 스키마(N1~N9). 백엔드 ShellDto 와 필드가 1:1 이다. */

const track = z.object({
  track: z.enum(['FREE', 'ONE', 'PAID']),
  primaryStudyRoomId: z.number().int().nullable(),
  studyRoomCount: z.number().int().nonnegative(),
});

const resumeItem = z.object({
  kind: z.enum(['REVIEW', 'SOLVE', 'NOTE']),
  refId: z.number().int().nullable(),
  title: z.string(),
  subtitle: z.string().nullable(),
});
const resume = z.object({ item: resumeItem.nullable() });

const periodBlock = z.object({
  pagesWritten: z.number().int(),
  revisions: z.number().int(),
  reviews: z.number().int(),
  exp: z.number().int(),
});
const periods = z.object({
  week: periodBlock,
  month: periodBlock,
  total: periodBlock,
  weeklyPages: z.array(z.object({ weekStart: z.string(), pages: z.number() })),
  activeExpScope: z.string(),
});

const officeSummary = z.object({
  roomName: z.string(),
  teacherName: z.string().nullable(),
  memberCounts: z.object({ teacher: z.number(), student: z.number() }),
  noteCount: z.number(),
  lectureCount: z.number(),
});

const notice = z.object({
  id: z.number().int(),
  title: z.string(),
  body: z.string(),
  pinned: z.boolean(),
  authorName: z.string().nullable(),
  regDate: z.string(),
});
const noticeList = z.object({ items: z.array(notice) });

const messageItem = z.object({
  id: z.number().int(),
  roomId: z.number().int(),
  templateCode: z.string(),
  body: z.string().nullable(),
  regDate: z.string(),
});
const messageList = z.object({ items: z.array(messageItem) });
const messageCreated = z.object({ id: z.number().int() });

const studentOverview = z.object({
  roomId: z.number().int(),
  profile: z.object({
    name: z.string(),
    schoolLabel: z.string().nullable(),
    grade: z.number().nullable(),
  }),
  counts: z.object({
    conceptNotes: z.number(),
    solutions: z.number(),
    questions: z.number(),
    missedDays: z.number().nullable(),
  }),
  activity14d: z.array(
    z.object({
      date: z.string(),
      studyMinutes: z.number(),
      state: z.string().nullable(),
    })
  ),
  noteWeek: z.object({
    pages: z.number(),
    deltaPages: z.number(),
    pinFixedRate: z.number().nullable(),
    avgSolveMinutes: z.number().nullable(),
  }),
  recentNotes: z.array(
    z.object({
      noteId: z.number().int(),
      nodeId: z.number().int(),
      title: z.string(),
      at: z.string(),
      pinCount: z.number().nullable(),
      unconfirmed: z.boolean(),
    })
  ),
  stuck: z.array(
    z.object({
      kind: z.string(),
      title: z.string(),
      at: z.string(),
      detail: z.string().nullable(),
    })
  ),
  messages: z.array(messageItem),
});

const appPolicy = z.object({
  scoreTable: z.object({
    noteFirstExp: z.number(),
    noteRevisionExp: z.number(),
    noteFromSolveExp: z.number(),
    pinAppliedExp: z.number(),
    aiAppliedExp: z.number(),
    solutionReviseExp: z.number(),
    blankFirstExp: z.number(),
    blankRepeatExp: z.number(),
    firstCorrectExp: z.number(),
    retrospectExp: z.number(),
    dailyCapExp: z.number(),
    explainCost: z.object({
      kind: z.string(),
      amount: z.number(),
      freeCount: z.number(),
    }),
  }),
  condition: z.object({ open: z.boolean(), reason: z.string() }),
});

const noticePayload = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(4000),
  pinned: z.boolean(),
});
const messagePayload = z.object({
  roomId: z.number().int().positive(),
  templateCode: z.string().min(1),
  body: z.string().max(300).nullable().optional(),
});

export const dto = {
  track,
  resume,
  periods,
  officeSummary,
  notice,
  noticeList,
  messageList,
  messageCreated,
  studentOverview,
  appPolicy,
};
export const payload = { notice: noticePayload, message: messagePayload };
