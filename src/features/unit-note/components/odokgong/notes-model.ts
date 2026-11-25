import type { UnitNoteNode } from '@/entities/unit-note';

export type NoteSort = 'recent' | 'order' | 'pages';
export type NoteView = 'bundle' | 'book';

export const NOTE_SORTS: readonly NoteSort[] = ['recent', 'order', 'pages'];
export const NOTE_VIEWS: readonly NoteView[] = ['bundle', 'book'];
export const SORT_STORAGE_KEY = 'odk.notes.sort';
export const VIEW_STORAGE_KEY = 'odk.notes.view';

/** 소단원(리프): 다른 노드의 부모가 아닌 노드. */
export const leafNodes = (nodes: UnitNoteNode[]): UnitNoteNode[] => {
  const parents = new Set(nodes.map((node) => node.parentId));
  return nodes.filter((node) => !parents.has(node.nodeId));
};

export type SubjectSummary = {
  subject: string;
  /** 쓴 단원 수 */
  written: number;
  /** 전체 소단원 수 */
  total: number;
};

/** 과목별 "쓴 단원/전체 단원". 과목 순서는 응답 순서를 따른다. */
export const summarizeSubjects = (nodes: UnitNoteNode[]): SubjectSummary[] => {
  const map = new Map<string, SubjectSummary>();
  for (const leaf of leafNodes(nodes)) {
    const entry = map.get(leaf.subject) ?? {
      subject: leaf.subject,
      written: 0,
      total: 0,
    };
    entry.total += 1;
    if (leaf.pageCount > 0) entry.written += 1;
    map.set(leaf.subject, entry);
  }
  return [...map.values()];
};

/** 정렬. order 는 서버가 준 단원 순서 그대로, 안 쓴 칸은 항상 뒤. */
export const sortLeaves = (
  leaves: UnitNoteNode[],
  sort: NoteSort
): UnitNoteNode[] => {
  if (sort === 'order') return leaves;
  const copy = [...leaves];
  if (sort === 'pages') {
    return copy.sort((a, b) => b.pageCount - a.pageCount);
  }
  return copy.sort((a, b) => {
    if (!a.lastPageAt && !b.lastPageAt) return 0;
    if (!a.lastPageAt) return 1;
    if (!b.lastPageAt) return -1;
    return b.lastPageAt.localeCompare(a.lastPageAt);
  });
};

/** 검색: 단원 이름에 검색어가 들어 있는 것(공백 무시, 대소문자 무시). */
export const filterByQuery = (
  leaves: UnitNoteNode[],
  query: string
): UnitNoteNode[] => {
  const needle = query.replace(/\s+/g, '').toLowerCase();
  if (!needle) return leaves;
  return leaves.filter((leaf) =>
    leaf.displayName.replace(/\s+/g, '').toLowerCase().includes(needle)
  );
};
