export type LevelSession = {
  testId: number;
  currentStep: number;
  status: string;
  problemSetIds: number[];
  answers: Record<number, string>;
};

export type LevelResult = {
  testId: number;
  resultCode: string;
  summary: string;
  status: string;
  benefitKind: 'NONE' | string;
};

export type Ebook = {
  ebookId: number;
  title: string;
  previewChapterCount: number;
  chapterCount: number;
};

export type EbookChapter = {
  ebookId: number;
  chapterNo: number;
  title: string;
  bodyHtml: string;
};

export type BufferCoupon = {
  id: number;
  expiresOn: string | null;
};

export type Program = {
  enrollmentId: number;
  courseTitle: string;
  status: 'PENDING_TEACHER' | 'ACTIVE';
  currentDay: number;
  totalDays: number;
  bufferCoupons: number;
  coupons: BufferCoupon[];
};

export type ProgramAssignment = {
  assignmentKey: string;
  type: 'LESSON' | 'CHALLENGE' | 'NOTE';
  challengeId: number | null;
  lessonId: number | null;
  status: 'TODO' | 'DONE';
};

export type ProgramDay = {
  dayNo: number;
  title: string;
  status: string;
  videoUnlocked: boolean;
  submitted: boolean;
  referenceAnchors: string[];
  date: string | null;
  assignments: ProgramAssignment[];
  done: boolean;
};

export type FeedItem = {
  id: number;
  kind: 'NOTE' | 'DECLARATION';
  title: string;
  preview: string;
  cheers: number;
  best: boolean;
};

export type Declaration = {
  id: number;
  kind: 'RESOLVE' | 'RETRO' | 'PLEDGE';
  body: string;
  redactedPreview: string;
  visibility: 'PRIVATE' | 'PUBLIC_ANON';
  evalStatus: 'QUEUED' | 'COMPLETED' | 'WAITING' | 'NONE';
  evaluation: string | null;
};

export type BestCandidate = {
  publicNoteId: number;
  studentName: string;
  title: string;
  preview: string;
  selected: boolean;
};
