import React from 'react';

import { cn } from '@/shared/lib';

type StatChipProps = React.ComponentPropsWithRef<'div'> & {
  label: string;
  value: React.ReactNode;
  tone?: 'neutral' | 'brand' | 'success' | 'warning';
  /** pill = 기존 한 줄 칩(기본), tile = 숫자를 크게 보이는 KPI 칸. */
  variant?: 'pill' | 'tile';
  unit?: string;
  /** 지난 기간 대비. 줄었어도 질책하지 않으므로 중립 문구로만 쓴다. */
  delta?: string;
  sub?: string;
};

const TONE_CLASS: Record<NonNullable<StatChipProps['tone']>, string> = {
  neutral: 'border-line-line1 bg-white text-text-main',
  brand: 'border-orange-3 bg-orange-1 text-orange-11',
  success:
    'border-system-success bg-system-success-alt text-system-success-text',
  warning:
    'border-system-warning bg-system-warning-alt text-system-warning-text',
};

export const StatChip = ({
  label,
  value,
  tone = 'neutral',
  variant = 'pill',
  unit,
  delta,
  sub,
  className,
  ...props
}: StatChipProps) => {
  if (variant === 'tile') {
    return (
      <div
        className={cn(
          'rounded-card p-card-pad gap-inline-gap flex min-w-0 flex-col border',
          TONE_CLASS[tone],
          className
        )}
        {...props}
      >
        <span className="font-caption-normal text-single-line">{label}</span>
        <strong className="font-headline2-heading numeric-tabular">
          {value}
          {unit && <span className="font-caption-normal ml-1">{unit}</span>}
        </strong>
        {delta && <span className="font-caption-normal">{delta}</span>}
        {sub && <span className="font-caption-normal text-gray-8">{sub}</span>}
      </div>
    );
  }
  return (
    <div
      className={cn(
        'min-h-chip-min rounded-pill px-card-pad gap-inline-gap inline-flex max-w-full min-w-0 items-center border',
        TONE_CLASS[tone],
        className
      )}
      {...props}
    >
      <span className="font-caption-normal text-single-line">{label}</span>
      <strong className="font-caption-heading numeric-tabular shrink-0">
        {value}
      </strong>
    </div>
  );
};
