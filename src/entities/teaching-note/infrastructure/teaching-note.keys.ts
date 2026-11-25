export const teachingNoteKeys = {
  all: ['teaching-note-lesson'] as const,
  lessonInfo: (studyRoomId: number) =>
    [...teachingNoteKeys.all, 'lesson-info', studyRoomId] as const,
  teacherLessonInfo: (studyRoomId: number, studentId?: number) =>
    [
      ...teachingNoteKeys.all,
      'teacher-lesson-info',
      studyRoomId,
      studentId ?? null,
    ] as const,
  shareResolve: (token: string) =>
    [...teachingNoteKeys.all, 'share-resolve', token] as const,
  problems: (role: 'student' | 'teacher', teachingNoteId: number) =>
    [...teachingNoteKeys.all, 'problems', role, teachingNoteId] as const,
  reviewSummary: (studentId: number) =>
    [...teachingNoteKeys.all, 'review-summary', studentId] as const,
  shareMeta: (token: string) =>
    [...teachingNoteKeys.all, 'share-meta', token] as const,
};
