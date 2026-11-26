import { api } from '@/shared/api';
import { unwrapEnvelope } from '@/shared/lib/api-utils';
import { z } from 'zod';

const blockSchema = z.object({
  id: z.number(),
  date: z.string(),
  startMin: z.number(),
  endMin: z.number(),
  track: z.enum(['TEACHER', 'ACADEMY', 'SELF']),
  title: z.string(),
  plannedMinutes: z.number(),
  actualMinutes: z.number(),
  todoId: z.number().nullable(),
  treeNodeId: z.number().nullable(),
});

const eventSchema = z.object({
  id: z.number(),
  kind: z.enum(['EXAM', 'MOCK', 'CSAT', 'GOAL', 'ETC']),
  title: z.string(),
  startsOn: z.string(),
  endsOn: z.string().nullable(),
  targetGrade: z.string().nullable(),
});

const defaultScopeSchema = z.object({
  kind: z.enum(['TODAY', 'WEEK', 'GOAL']),
  until: z.string(),
});

export type ScheduleBlock = z.infer<typeof blockSchema>;
export type YearEvent = z.infer<typeof eventSchema>;
export type BlockInput = Omit<
  ScheduleBlock,
  'id' | 'plannedMinutes' | 'actualMinutes'
>;
export type YearEventInput = Omit<YearEvent, 'id'>;

const getSchedule = async (from: string, to: string) => {
  const response = await api.private.get('/student/schedule', {
    params: { from, to },
  });
  return unwrapEnvelope(
    response,
    z.object({ blocks: z.array(blockSchema), defaultScope: defaultScopeSchema })
  );
};

export type ActivitySessionInput = {
  kind: 'SOLVE' | 'NOTE_WRITE' | 'REVIEW';
  startedAt: string;
  endedAt: string;
  refType: 'SOLUTION_NOTE' | 'UNIT_NOTE_PAGE' | 'WRONG_ANSWER';
  refId: number;
};

const createActivitySession = async (input: ActivitySessionInput) => {
  const response = await api.private.post('/student/activity-sessions', input);
  return unwrapEnvelope(
    response,
    z.object({ id: z.number(), actualMinutes: z.number() })
  );
};

const createBlock = async (input: BlockInput) => {
  const response = await api.private.post('/student/schedule/blocks', input);
  return unwrapEnvelope(response, blockSchema);
};

const updateBlock = async (id: number, input: BlockInput) => {
  const response = await api.private.patch(
    `/student/schedule/blocks/${id}`,
    input
  );
  return unwrapEnvelope(response, blockSchema);
};

const deleteBlock = async (id: number) =>
  api.private.delete(`/student/schedule/blocks/${id}`);

const getYearEvents = async (from: string, to: string) => {
  const response = await api.private.get('/student/year-events', {
    params: { from, to },
  });
  return unwrapEnvelope(response, z.array(eventSchema));
};

const createYearEvent = async (input: YearEventInput) => {
  const response = await api.private.post('/student/year-events', input);
  return unwrapEnvelope(response, eventSchema);
};

const updateYearEvent = async (id: number, input: YearEventInput) => {
  const response = await api.private.patch(`/student/year-events/${id}`, input);
  return unwrapEnvelope(response, eventSchema);
};

const deleteYearEvent = async (id: number) =>
  api.private.delete(`/student/year-events/${id}`);

export const scheduleApi = {
  getSchedule,
  createBlock,
  updateBlock,
  deleteBlock,
  getYearEvents,
  createYearEvent,
  updateYearEvent,
  deleteYearEvent,
  createActivitySession,
};
