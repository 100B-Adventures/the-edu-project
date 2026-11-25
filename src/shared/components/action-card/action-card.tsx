import type { ReactNode } from 'react';

import Link from 'next/link';

import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib';

type ActionCardProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  due?: string;
  /** soft-late 는 중립 톤. 밀린 일을 빨강·경고로 말하지 않는다(AC-46e). */
  state?: 'todo' | 'done' | 'soft-late';
  cta: {
    label: string;
    href?: string;
    onClick?: () => void;
    disabled?: boolean;
  };
  reward?: ReactNode;
  variant?: 'card' | 'line';
  className?: string;
};

/** 오늘 할 일 하나를 크게 보여 주고 행동 버튼 하나를 준다. `line` 은 홈의 이어서 하기 한 줄. */
export const ActionCard = ({
  eyebrow,
  title,
  subtitle,
  due,
  state = 'todo',
  cta,
  reward,
  variant = 'card',
  className,
}: ActionCardProps) => (
  <section
    className={cn(
      'border-line-line1 rounded-card border bg-white',
      variant === 'card'
        ? 'p-card-pad gap-block-gap flex flex-col'
        : 'px-card-pad py-content-gap gap-block-gap flex items-center justify-between',
      state === 'soft-late' && 'bg-gray-1',
      className
    )}
    data-state={state}
  >
    <div className="min-w-0">
      {eyebrow && (
        <p className="font-caption-heading text-orange-11">{eyebrow}</p>
      )}
      <h2 className="font-headline2-heading text-text-main text-heading-wrap">
        {title}
      </h2>
      {subtitle && (
        <p className="font-body2-normal text-gray-9 text-two-lines">
          {subtitle}
        </p>
      )}
      {due && <p className="font-caption-normal text-gray-8">{due}</p>}
    </div>
    <div className="gap-content-gap flex shrink-0 items-center">
      {reward}
      {cta.href ? (
        <Link
          href={cta.href}
          className="min-h-control-sm px-button-default-x rounded-button bg-orange-9 font-body2-heading hover:bg-orange-10 border-orange-10 inline-flex items-center justify-center border text-white"
        >
          {cta.label}
        </Link>
      ) : (
        <Button
          size="small"
          onClick={cta.onClick}
          disabled={cta.disabled}
        >
          {cta.label}
        </Button>
      )}
    </div>
  </section>
);
