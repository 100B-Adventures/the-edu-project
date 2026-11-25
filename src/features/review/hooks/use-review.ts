import {
  type BlankRetryPayload,
  type ReviewCardsQuery,
  type ReviewImportPayload,
  type ReviewView,
  reviewKeys,
  reviewRepository,
} from '@/entities/wrong-answer';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useReviewOverviewQuery = (view: ReviewView, enabled = true) =>
  useQuery({
    queryKey: reviewKeys.overview(view),
    queryFn: () => reviewRepository.getOverview(view),
    enabled,
  });

export const useReviewCardsQuery = (query: ReviewCardsQuery, enabled = true) =>
  useQuery({
    queryKey: reviewKeys.cards(query),
    queryFn: () => reviewRepository.getCards(query),
    enabled,
  });

export const useImportProblemsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReviewImportPayload) =>
      reviewRepository.importProblems(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });
};

export const useRandomProblemMutation = () =>
  useMutation({ mutationFn: () => reviewRepository.getRandomProblem() });

export const useStartBlankSessionMutation = () =>
  useMutation({
    mutationFn: (wrongAnswerId: number) =>
      reviewRepository.startBlankSession(wrongAnswerId),
  });

export const useFinishBlankRetryMutation = (wrongAnswerId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BlankRetryPayload) =>
      reviewRepository.finishBlankRetry(wrongAnswerId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });
};
