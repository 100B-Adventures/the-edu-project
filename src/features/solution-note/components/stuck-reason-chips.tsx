'use client';

import { Button } from '@/shared/components/ui';
import { cn } from '@/shared/lib';

import { STUCK_REASON_LABEL } from '../../review/review-labels';

/** 시안 solve.html `#nr` 일곱 칩. 골라 두면 N회독에 넣을 때 묶인다. */
export const STUCK_REASON_ORDER = [
  'TOOK_LONG',
  'NO_APPROACH',
  'NOT_FINISHED',
  'CONCEPT_GAP',
  'STOPPED_MIDWAY',
  'EXPL_HARD',
  'CORRECT_BUT_AGAIN',
] as const;

type StuckReasonChipsProps = {
  selected: string[];
  disabled?: boolean;
  onToggle: (code: string) => void;
};

export const StuckReasonChips = ({
  selected,
  disabled,
  onToggle,
}: StuckReasonChipsProps) => (
  <div
    role="group"
    aria-label="어디서 막혔나요"
    className="flex items-center gap-2 overflow-x-auto lg:flex-wrap lg:overflow-visible"
  >
    <span className="font-body2-heading text-text-main shrink-0">
      어디서 막혔나요
    </span>
    {STUCK_REASON_ORDER.map((code) => {
      const on = selected.includes(code);
      return (
        <Button
          key={code}
          variant="unstyled"
          aria-pressed={on}
          disabled={disabled}
          onClick={() => onToggle(code)}
          data-testid="stuck-chip"
          className={cn(
            'rounded-pill font-body2-heading min-h-touch-min shrink-0 border px-4',
            on
              ? 'border-orange-9 bg-orange-1 text-orange-10'
              : 'border-line-line2 text-text-main bg-white'
          )}
        >
          {STUCK_REASON_LABEL[code]}
        </Button>
      );
    })}
  </div>
);
