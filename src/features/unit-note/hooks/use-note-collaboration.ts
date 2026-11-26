import { collaborationApi } from '@/features/unit-note/api/collaboration-api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useNotePins = (pageId?: number) =>
  useQuery({
    queryKey: ['unit-note-pins', pageId],
    queryFn: () => collaborationApi.pins(pageId as number),
    enabled: Boolean(pageId),
  });

export const useNoteSearch = (
  query: string,
  tab: string,
  challengeId?: number
) =>
  useQuery({
    queryKey: ['unit-note-search', query, tab, challengeId],
    queryFn: () => collaborationApi.search(query, tab, challengeId),
  });

export const useNoteReferences = (pageId: number) => {
  const queryClient = useQueryClient();
  const queryKey = ['unit-note-references', pageId];
  return {
    query: useQuery({
      queryKey,
      queryFn: () => collaborationApi.references(pageId),
    }),
    add: useMutation({
      mutationFn: (input: Parameters<typeof collaborationApi.addReference>[1]) =>
        collaborationApi.addReference(pageId, input),
      onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    }),
    remove: useMutation({
      mutationFn: (referenceId: number) =>
        collaborationApi.deleteReference(pageId, referenceId),
      onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    }),
  };
};
