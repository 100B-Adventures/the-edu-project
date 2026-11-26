import { assignOverlapColumns } from '@/features/schedule/model/overlap-layout';
import { describe, expect, it } from 'vitest';

describe('MVP-H 조각 2 시간표 겹침', () => {
  it('T-SCH-1b 같은 트랙을 포함한 겹친 블록을 나란히 배치한다', () => {
    const result = assignOverlapColumns([
      { id: 1, startMin: 600, endMin: 720 },
      { id: 2, startMin: 630, endMin: 690 },
      { id: 3, startMin: 650, endMin: 700 },
      { id: 4, startMin: 660, endMin: 710 },
    ]);

    expect(result.map(({ column }) => column)).toEqual([0, 1, 2, 3]);
    expect(result.every(({ columnCount }) => columnCount === 4)).toBe(true);
    expect(result.at(-1)?.foldedCount).toBe(1);
  });

  it('T-SCH-8 블록이 없으면 빈 배열을 돌려준다', () => {
    expect(assignOverlapColumns([])).toEqual([]);
  });
});
