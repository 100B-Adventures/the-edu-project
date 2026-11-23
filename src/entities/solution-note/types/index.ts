import type { z } from 'zod';

import type { dto, payload } from '../infrastructure/solution-note.dto';

export type SolutionNoteCreated = z.infer<typeof dto.createResponse>;
export type SolutionNoteDetail = z.infer<typeof dto.detail>;
export type SolutionExplanation = z.infer<typeof dto.explanation>;
export type SolutionVersion = z.infer<typeof dto.version>;
export type SolutionRevised = z.infer<typeof dto.reviseResponse>;
export type StuckReasonSaved = z.infer<typeof dto.stuckReasonResponse>;
export type CreateSolutionNotePayload = z.infer<typeof payload.createRequest>;
export type ReviseSolutionNotePayload = z.infer<typeof payload.reviseRequest>;
export type DiffMark = { y0: number; y1: number };

/** 막힌 이유 코드(api-contract §0.3). 화면 문구는 STUCK_REASON_LABEL. */
export type StuckReason =
  | 'TOOK_LONG'
  | 'NO_APPROACH'
  | 'NOT_FINISHED'
  | 'CONCEPT_GAP'
  | 'STOPPED_MIDWAY'
  | 'EXPL_HARD'
  | 'CORRECT_BUT_AGAIN';
