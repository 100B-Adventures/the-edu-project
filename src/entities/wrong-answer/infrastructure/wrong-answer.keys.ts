/* ─────────────────────────────────────────────────────
 * 오답 회독 Query Keys
 * ────────────────────────────────────────────────────*/
export const wrongAnswerKeys = {
  all: ['wrong-answer'] as const,
  dailyProblems: (date?: string) =>
    [...wrongAnswerKeys.all, 'daily-problems', date ?? 'today'] as const,
  list: (nodeId?: number) =>
    [...wrongAnswerKeys.all, 'list', nodeId ?? 'all'] as const,
  teacherInbox: () => [...wrongAnswerKeys.all, 'teacher-inbox'] as const,
};

/** mvp-h 조각 1: N회독 첫 화면·카드·백지 다시 풀기 */
export const reviewKeys = {
  all: ['review'] as const,
  overview: (view: string) => [...reviewKeys.all, 'overview', view] as const,
  cards: (query: unknown) => [...reviewKeys.all, 'cards', query] as const,
};
