// D-034: 기능·데이터·라우트는 유지하고 학생 화면의 비코어 진입점만 렌더에서 숨긴다.
export const D034_HIDDEN = {
  'student.sidebar.exam-hall': true,
  'student.sidebar.friends': true,
  'student.sidebar.points': true,
  'student.sidebar.weakness-tree': true,
  'student.dashboard.exam-hall-card': true,
  'student.header.points': true,
} as const;

export type D034HiddenSurface = keyof typeof D034_HIDDEN;

export const isD034HiddenForRole = (
  role: string | null | undefined,
  surface: D034HiddenSurface
) => role === 'ROLE_STUDENT' && D034_HIDDEN[surface];
