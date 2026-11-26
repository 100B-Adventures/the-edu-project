import {
  scheduleApi,
  type BlockInput,
} from '@/features/schedule/api/schedule-api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const scheduleKeys = {
  week: (from: string, to: string) => ['schedule', from, to] as const,
  year: (from: string, to: string) => ['year-events', from, to] as const,
};

export const useScheduleQuery = (from: string, to: string) =>
  useQuery({
    queryKey: scheduleKeys.week(from, to),
    queryFn: () => scheduleApi.getSchedule(from, to),
  });

export const useYearEventsQuery = (from: string, to: string) =>
  useQuery({
    queryKey: scheduleKeys.year(from, to),
    queryFn: () => scheduleApi.getYearEvents(from, to),
  });

export const useScheduleMutations = () => {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['schedule'] });
  return {
    create: useMutation({ mutationFn: scheduleApi.createBlock, onSuccess: refresh }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: number; input: BlockInput }) =>
        scheduleApi.updateBlock(id, input),
      onSuccess: refresh,
    }),
    remove: useMutation({ mutationFn: scheduleApi.deleteBlock, onSuccess: refresh }),
  };
};

export const useYearEventMutations = () => {
  const queryClient = useQueryClient();
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ['year-events'] });
  return {
    create: useMutation({
      mutationFn: scheduleApi.createYearEvent,
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: scheduleApi.deleteYearEvent,
      onSuccess: refresh,
    }),
  };
};
