import type { Stroke } from '@/shared/components/drawing';

export type DiffMark = { y0: number; y1: number };

const MERGE_GAP = 0.02;
const round3 = (value: number) => Math.round(value * 1000) / 1000;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * 고치기에서 새로 쓴 획(이전 판에 없던 획 id)이 닿는 세로 구간을 0~1 로 모아 돌려준다.
 * 서버는 이 구간으로 "다른 곳 N" 표시와 내용 변화 판정을 돕는다(api-contract §1.6).
 */
export const computeDiffMarks = (
  baseStrokes: Stroke[],
  strokes: Stroke[]
): DiffMark[] => {
  const baseIds = new Set(baseStrokes.map((stroke) => stroke.id));
  const ranges = strokes
    .filter((stroke) => !baseIds.has(stroke.id) && stroke.points.length > 0)
    .map((stroke) => {
      const ys = stroke.points.map((point) => clamp01(point.y));
      return { y0: Math.min(...ys), y1: Math.max(...ys) };
    })
    .sort((a, b) => a.y0 - b.y0);

  const merged: DiffMark[] = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (last && range.y0 - last.y1 <= MERGE_GAP) {
      last.y1 = Math.max(last.y1, range.y1);
    } else {
      merged.push({ ...range });
    }
  }
  return merged.map((mark) => ({ y0: round3(mark.y0), y1: round3(mark.y1) }));
};
