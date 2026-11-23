import {
  dto,
  payload,
} from '@/entities/wrong-answer/infrastructure/wrong-answer.dto';
import { z } from 'zod';

export type DailyProblemItem = z.infer<typeof dto.dailyProblemItem>;
export type DailyProblemQueue = z.infer<typeof dto.dailyProblemQueue>;
export type WrongAnswerItem = z.infer<typeof dto.wrongAnswerItem>;
export type WrongAnswerList = z.infer<typeof dto.wrongAnswerList>;
export type ReviewWrongAnswerPayload = z.infer<typeof payload.review>;
export type WrongAnswerReviewResult = z.infer<typeof dto.reviewResult>;
export type TeacherWrongAnswerInbox = z.infer<typeof dto.teacherInbox>;
export * from './review';
