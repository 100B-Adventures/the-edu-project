/** '2026-11-24' 또는 '2026-11-24T10:00:00' → '11월 24일'. 읽을 수 없으면 빈 문자열. */
export const monthDayLabel = (iso?: string | null): string => {
  if (!iso) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return '';
  return `${Number(match[2])}월 ${Number(match[3])}일`;
};
