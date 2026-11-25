import {
  type ReviseSolutionNotePayload,
  solutionNoteKeys,
  solutionNoteRepository,
} from '@/entities/solution-note';
import { reviewKeys } from '@/entities/wrong-answer';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useSolutionNoteDetailQuery = (id: number) =>
  useQuery({
    queryKey: solutionNoteKeys.detail(id),
    queryFn: () => solutionNoteRepository.getDetail(id),
  });

export const useSolutionExplanationQuery = (id: number) =>
  useQuery({
    queryKey: solutionNoteKeys.explanation(id),
    queryFn: () => solutionNoteRepository.getExplanation(id),
    retry: false,
    // 열람은 서버에 기록이 남는 POST 라 창 포커스·재마운트마다 다시 부르지 않는다.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

export const useReviseSolutionNoteMutation = (id: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReviseSolutionNotePayload) =>
      solutionNoteRepository.revise(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: solutionNoteKeys.detail(id),
      });
    },
  });
};

export const useSaveStuckReasonsMutation = (id: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reasons: string[]) =>
      solutionNoteRepository.saveStuckReasons(id, reasons),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });
};
