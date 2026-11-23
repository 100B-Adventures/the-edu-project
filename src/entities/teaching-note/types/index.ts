import type { z } from 'zod';

import type { dto, payload } from '../infrastructure/teaching-note.dto';

export type LessonInfo = z.infer<typeof dto.lessonInfo>;
export type AttachProblemResult = z.infer<typeof dto.attachProblem>;
export type ShareLink = z.infer<typeof dto.shareLink>;
export type ShareMeta = z.infer<typeof dto.shareMeta>;
export type StudentReviewSummary = z.infer<typeof dto.studentReviewSummary>;
export type AttachProblemPayload = z.infer<typeof payload.attachProblemRequest>;
export type LessonInfoPayload = z.infer<typeof payload.lessonInfoRequest>;
