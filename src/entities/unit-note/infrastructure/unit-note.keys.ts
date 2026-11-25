export const unitNoteKeys = {
  all: ['unit-note'] as const,
  library: () => [...unitNoteKeys.all, 'library'] as const,
  detail: (nodeId: number) => [...unitNoteKeys.all, 'detail', nodeId] as const,
  studentDetail: (studentId: number, nodeId: number) =>
    [...unitNoteKeys.all, 'student-detail', studentId, nodeId] as const,
};
