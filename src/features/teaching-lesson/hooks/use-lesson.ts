import {
  type LessonInfoPayload,
  teachingNoteKeys,
  teachingNoteRepository,
} from '@/entities/teaching-note';
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

export const useLessonInfoQuery = (studyRoomId: number) =>
  useQuery({
    queryKey: teachingNoteKeys.lessonInfo(studyRoomId),
    queryFn: () => teachingNoteRepository.getLessonInfo(studyRoomId),
  });

export const useTeacherLessonInfoQuery = (studyRoomId: number) =>
  useQuery({
    queryKey: teachingNoteKeys.teacherLessonInfo(studyRoomId),
    queryFn: () => teachingNoteRepository.getTeacherLessonInfo(studyRoomId),
  });

/** 수업노트별 같이 푼 문제. 노트 id 마다 한 번씩 읽는다. */
export const useNoteProblemsQueries = (
  role: 'student' | 'teacher',
  teachingNoteIds: number[]
) =>
  useQueries({
    queries: teachingNoteIds.map((id) => ({
      queryKey: teachingNoteKeys.problems(role, id),
      queryFn: () => teachingNoteRepository.getNoteProblems(role, id),
    })),
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
        queryKey: teachingNoteKeys.teacherLessonInfo(studyRoomId),
      });
    },
  });
};

export const useCreateShareLinkMutation = () =>
  useMutation({
    mutationFn: (teachingNoteId: number) =>
      teachingNoteRepository.createShareLink(teachingNoteId),
  });

export const useAttachProblemMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { teachingNoteId: number; challengeId: number }) =>
      teachingNoteRepository.attachProblem(input.teachingNoteId, {
        challengeId: input.challengeId,
        solvedTogether: true,
        memo: null,
      }),
    onSuccess: async (_result, input) => {
      await queryClient.invalidateQueries({
        queryKey: teachingNoteKeys.problems('teacher', input.teachingNoteId),
      });
    },
  });
};

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
