export const teachingNoteKeys = {
  all: ['teaching-note-lesson'] as const,
  lessonInfo: (studyRoomId: number) =>
    [...teachingNoteKeys.all, 'lesson-info', studyRoomId] as const,
  reviewSummary: (studentId: number) =>
    [...teachingNoteKeys.all, 'review-summary', studentId] as const,
  shareMeta: (token: string) =>
    [...teachingNoteKeys.all, 'share-meta', token] as const,
};
