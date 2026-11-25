import {
  type MessagePayload,
  type NoticePayload,
  shellKeys,
  shellRepository,
} from '@/entities/shell';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/** N2 홈 이어서 하기 한 줄. 학생만 부른다. */
export const useResumeQuery = (enabled = true) =>
  useQuery({
    queryKey: shellKeys.resume(),
    queryFn: shellRepository.getResume,
    enabled,
  });

/** N3 기간 성과와 주별 쪽 수. */
export const useGrowthPeriodsQuery = (weeks?: number) =>
  useQuery({
    queryKey: shellKeys.periods(weeks),
    queryFn: () => shellRepository.getPeriods(weeks),
  });

/** 선생님이 보낸 빠른 메시지(학생 받은 것). */
export const useReceivedMessagesQuery = () =>
  useQuery({
    queryKey: shellKeys.messages(),
    queryFn: shellRepository.getReceivedMessages,
  });

/** N4 교무실 머리 카드. */
export const useOfficeSummaryQuery = (roomId: number) =>
  useQuery({
    queryKey: shellKeys.office(roomId),
    queryFn: () => shellRepository.getOfficeSummary(roomId),
  });

/** N5 공지 읽기. 학생·선생님 모두 읽는다. */
export const useNoticesQuery = (role: 'student' | 'teacher', roomId: number) =>
  useQuery({
    queryKey: shellKeys.notices(role, roomId),
    queryFn: () => shellRepository.getNotices(role, roomId),
  });

export const useNoticeMutations = (roomId: number) => {
  const queryClient = useQueryClient();
  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: shellKeys.notices('teacher', roomId),
    });
  return {
    create: useMutation({
      mutationFn: (input: NoticePayload) =>
        shellRepository.createNotice(roomId, input),
      onSuccess: refresh,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: number; input: NoticePayload }) =>
        shellRepository.updateNotice(roomId, id, input),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: (id: number) => shellRepository.removeNotice(roomId, id),
      onSuccess: refresh,
    }),
  };
};

/** N6 선생님이 보는 학생 상세. */
export const useStudentOverviewQuery = (studentId: number, roomId?: number) =>
  useQuery({
    queryKey: shellKeys.overview(studentId, roomId),
    queryFn: () => shellRepository.getStudentOverview(studentId, roomId),
  });

/** N8 보낸 메시지 목록과 보내기. */
export const useSentMessagesQuery = (studentId: number, roomId?: number) =>
  useQuery({
    queryKey: shellKeys.sentMessages(studentId, roomId),
    queryFn: () => shellRepository.getSentMessages(studentId, roomId),
  });

export const useSendMessageMutation = (studentId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MessagePayload) =>
      shellRepository.sendMessage(studentId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: [...shellKeys.all, 'sent', studentId],
      }),
  });
};

/** N9 보상 숫자·조건해석. 화면의 숫자는 전부 여기서 읽는다(소스에 숫자 상수 0). */
export const useAppPolicyQuery = () =>
  useQuery({
    queryKey: shellKeys.policy(),
    queryFn: shellRepository.getPolicy,
    staleTime: 1000 * 60 * 30,
  });
