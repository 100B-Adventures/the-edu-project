import type { z } from 'zod';

import type {
  reviewDto,
  reviewPayload,
} from '../infrastructure/review.dto';

export type ReviewOverview = z.infer<typeof reviewDto.overview>;
export type ReviewCard = z.infer<typeof reviewDto.cards>['items'][number];
export type ReviewCards = z.infer<typeof reviewDto.cards>;
export type ReviewImportResult = z.infer<typeof reviewDto.importResponse>;
export type ReviewRandomProblem = z.infer<typeof reviewDto.randomProblem>;
export type BlankSession = z.infer<typeof reviewDto.blankSession>;
export type BlankRetryResult = z.infer<typeof reviewDto.blankRetryResponse>;
export type BlankRetryPayload = z.infer<
  typeof reviewPayload.blankRetryRequest
>;
export type ReviewImportPayload = z.infer<typeof reviewPayload.importRequest>;

export type ReviewView = 'curve' | 'situation' | 'unit';

export type ReviewCardsQuery =
  | { view: 'curve'; bucket?: number }
  | { view: 'situation'; reason: string }
  | { view: 'unit'; nodeId: number }
  | { view: 'soon'; within: number };
