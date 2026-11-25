import { StatusBadge } from '@/shared/components/ui/status-badge';

type RewardBadgeProps = {
  kind: 'exp' | 'point';
  /** 호출자가 N9 정책에서 받아 넘긴다. 이 컴포넌트에는 숫자 상수가 없다. */
  amount: number;
  state?: 'pending' | 'earned' | 'capped';
  className?: string;
};

const SUFFIX = { exp: 'EXP', point: 'P' } as const;

/** 보상 표기. 숫자는 서버 값이고, 한도에 닿으면 질책 없이 중립 톤으로만 보인다. */
export const RewardBadge = ({
  kind,
  amount,
  state = 'pending',
  className,
}: RewardBadgeProps) => {
  const label =
    kind === 'exp' ? `+${amount} ${SUFFIX.exp}` : `${amount}${SUFFIX.point}`;
  return (
    <StatusBadge
      className={className}
      variant={
        state === 'earned'
          ? 'success'
          : state === 'capped'
            ? 'default'
            : 'primary'
      }
      label={state === 'capped' ? `${label} · 오늘 한도` : label}
    />
  );
};
