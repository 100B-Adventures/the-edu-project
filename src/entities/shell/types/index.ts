import { dto, payload } from '@/entities/shell/infrastructure/shell.dto';
import { z } from 'zod';

export type ShellTrack = z.infer<typeof dto.track>;
export type StudentTrack = ShellTrack['track'];
export type ResumeResponse = z.infer<typeof dto.resume>;
export type ResumeItem = NonNullable<ResumeResponse['item']>;
export type GrowthPeriods = z.infer<typeof dto.periods>;
export type PeriodBlock = GrowthPeriods['week'];
export type OfficeSummary = z.infer<typeof dto.officeSummary>;
export type Notice = z.infer<typeof dto.notice>;
export type NoticePayload = z.infer<typeof payload.notice>;
export type ShellMessage = z.infer<typeof dto.messageList>['items'][number];
export type MessagePayload = z.infer<typeof payload.message>;
export type StudentOverview = z.infer<typeof dto.studentOverview>;
export type AppPolicy = z.infer<typeof dto.appPolicy>;
