'use client';

import Link from 'next/link';

import { cn } from '@/shared/lib';

export type SegmentedTabItem = {
  id: string;
  label: string;
  badge?: number;
  /** 있으면 상태가 아니라 주소로 가르는 링크 탭(교무실 탭). */
  href?: string;
};

type SegmentedTabsProps = {
  items: SegmentedTabItem[];
  value: string;
  onChange?: (id: string) => void;
  ariaLabel: string;
  variant?: 'pill' | 'underline';
  className?: string;
};

const BASE =
  'min-h-touch-min font-body2-heading inline-flex items-center justify-center gap-inline-gap-xs whitespace-nowrap px-button-chip-x transition-colors duration-100';

const tabClass = (variant: 'pill' | 'underline', active: boolean) =>
  variant === 'pill'
    ? cn(
        BASE,
        'rounded-pill',
        active ? 'bg-orange-1 text-orange-11' : 'text-gray-9 hover:bg-gray-1'
      )
    : cn(
        BASE,
        'border-b-2',
        active
          ? 'border-orange-9 text-orange-11'
          : 'text-gray-9 border-transparent'
      );

/** 탭 묶음. `href` 가 있는 항목은 링크, 없으면 `onChange` 로 값을 바꾼다. */
export const SegmentedTabs = ({
  items,
  value,
  onChange,
  ariaLabel,
  variant = 'pill',
  className,
}: SegmentedTabsProps) => (
  <div
    role="tablist"
    aria-label={ariaLabel}
    className={cn('gap-inline-gap flex overflow-x-auto', className)}
  >
    {items.map((tab) => {
      const active = tab.id === value;
      const content = (
        <>
          {tab.label}
          {tab.badge ? (
            <span className="font-caption-heading numeric-tabular">
              {tab.badge}
            </span>
          ) : null}
        </>
      );
      if (tab.href) {
        return (
          <Link
            key={tab.id}
            role="tab"
            aria-selected={active}
            href={tab.href}
            className={tabClass(variant, active)}
          >
            {content}
          </Link>
        );
      }
      return (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onChange?.(tab.id)}
          className={tabClass(variant, active)}
        >
          {content}
        </button>
      );
    })}
  </div>
);
