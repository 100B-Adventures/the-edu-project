export const solutionNoteKeys = {
  all: ['solution-note'] as const,
  byNode: (nodeId: number) =>
    [...solutionNoteKeys.all, 'node', nodeId] as const,
  detail: (id: number) => [...solutionNoteKeys.all, 'detail', id] as const,
  explanation: (id: number) =>
    [...solutionNoteKeys.all, 'explanation', id] as const,
  version: (id: number, versionNo: number) =>
    [...solutionNoteKeys.all, 'version', id, versionNo] as const,
};
