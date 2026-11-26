type TimeBlock = { id: number; startMin: number; endMin: number };

export type PositionedBlock<T extends TimeBlock> = T & {
  column: number;
  columnCount: number;
  foldedCount: number;
};

/** 겹친 블록은 같은 트랙도 막지 않고 열을 나눠 그린다. 네 번째부터 접힘 수를 함께 준다. */
export const assignOverlapColumns = <T extends TimeBlock>(
  blocks: T[]
): PositionedBlock<T>[] => {
  const sorted = [...blocks].sort(
    (left, right) => left.startMin - right.startMin || left.id - right.id
  );
  const result: PositionedBlock<T>[] = [];
  let group: T[] = [];
  let groupEnd = -1;

  const flush = () => {
    if (group.length === 0) return;
    const columnEnds: number[] = [];
    const positioned = group.map((block) => {
      const reusable = columnEnds.findIndex((end) => end <= block.startMin);
      const column = reusable === -1 ? columnEnds.length : reusable;
      columnEnds[column] = block.endMin;
      return { block, column };
    });
    const columnCount = columnEnds.length;
    positioned.forEach(({ block, column }, index) => {
      result.push({
        ...block,
        column,
        columnCount,
        foldedCount:
          columnCount > 3 && index === positioned.length - 1
            ? columnCount - 3
            : 0,
      });
    });
    group = [];
    groupEnd = -1;
  };

  sorted.forEach((block) => {
    if (group.length > 0 && block.startMin >= groupEnd) flush();
    group.push(block);
    groupEnd = Math.max(groupEnd, block.endMin);
  });
  flush();
  return result;
};
