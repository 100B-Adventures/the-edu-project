import {
  teachingNoteKeys,
  teachingNoteRepository,
  type LessonInfoPayload,
} from '@/entities/teaching-note';
import { reviewKeys, reviewRepository } from '@/entities/wrong-answer';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useLessonInfoQuery = (studyRoomId: number) =>
  useQuery({
    queryKey: teachingNoteKeys.lessonInfo(studyRoomId),
    queryFn: () => teachingNoteRepository.getLessonInfo(studyRoomId),
  });

export const useSaveMemoMutation = (studyRoomId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      teachingNoteRepository.saveMemo(studyRoomId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: teachingNoteKeys.lessonInfo(studyRoomId),
      });
    },
  });
};

export const useSaveLessonInfoMutation = (studyRoomId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LessonInfoPayload) =>
      teachingNoteRepository.saveLessonInfo(studyRoomId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: teachingNoteKeys.lessonInfo(studyRoomId),
      });
    },
  });
};

/**
 * 같이 푼 문제. 서버에 수업노트별 문제 읽기 API가 없어(build log slice1 미해결 1번)
 * 학생 본인의 N회독 카드 중 출처가 수업(CLASS)인 것만 모은다.
 */
export const useClassProblemCardsQuery = (enabled: boolean) =>
  useQuery({
    queryKey: [...reviewKeys.all, 'class-origin'],
    queryFn: async () => {
      const cards = await reviewRepository.getCards({ view: 'curve' });
      return cards.items.filter((card) => card.origin?.kind === 'CLASS');
    },
    enabled,
  });

export const useCreateShareLinkMutation = () =>
  useMutation({
    mutationFn: (teachingNoteId: number) =>
      teachingNoteRepository.createShareLink(teachingNoteId),
  });

export const useAttachProblemMutation = () =>
  useMutation({
    mutationFn: (input: { teachingNoteId: number; challengeId: number }) =>
      teachingNoteRepository.attachProblem(input.teachingNoteId, {
        challengeId: input.challengeId,
        solvedTogether: true,
        memo: null,
      }),
  });

export const useStudentReviewSummaryQuery = (studentId: number) =>
  useQuery({
    queryKey: teachingNoteKeys.reviewSummary(studentId),
    queryFn: () => teachingNoteRepository.getStudentReviewSummary(studentId),
  });

export const useWeeklyQuestionMutation = (studyRoomId: number) =>
  useMutation({
    mutationFn: (input: { title: string; content: string }) =>
      teachingNoteRepository.askWeeklyQuestion(studyRoomId, input),
  });
