import { useRef } from 'react';

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

/**
 * 가져오기 한 번의 뜻(intent)마다 키 하나. 성공할 때까지는 같은 키를 쓰므로 더블클릭·재시도가 한 번만 반영되고,
 * 성공한 뒤에는 새 키로 바뀌어 다음 가져오기가 첫 응답을 되돌려받지 않는다(교차 리뷰 P1-6).
 */
export const useImportProblemsMutation = () => {
  const queryClient = useQueryClient();
  const keyRef = useRef<string | null>(null);
  return useMutation({
    mutationFn: (input: ReviewImportPayload) => {
      keyRef.current ??= `imp-${crypto.randomUUID()}`;
      return reviewRepository.importProblems(input, keyRef.current);
    },
    onSuccess: async () => {
      keyRef.current = null;
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
    // 백지 세션 하나는 한 번만 끝난다. 세션 번호가 곧 이 요청의 키다(교차 리뷰 P1-6).
    mutationFn: (input: BlankRetryPayload) =>
      reviewRepository.finishBlankRetry(
        wrongAnswerId,
        input,
        `blank-${input.blankSessionId}`
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });
};
