'use client';

import type { ReactNode } from 'react';

import { Button } from '@/shared/components/ui/button';
import { EmptyState } from '@/shared/components/ui/empty-state';

import { Skeleton } from '../loading';
import { useOnline } from './use-online';

export type ScreenStatus =
  | 'loading'
  | 'error'
  | 'empty'
  | 'forbidden'
  | 'offline'
  | 'ready';

type ScreenStateProps = {
  status: ScreenStatus;
  children?: ReactNode;
  /** 로딩 뼈대. 없으면 블록 셋. */
  skeleton?: ReactNode;
  empty?: { title: string; description?: string; action?: ReactNode };
  error?: { title?: string; onRetry?: () => void };
  forbidden?: { title?: string; description?: string };
};

const DefaultSkeleton = () => (
  <div
    className="gap-block-gap flex flex-col"
    aria-busy="true"
    data-testid="screen-state-skeleton"
  >
    <Skeleton.Block className="h-24 w-full" />
    <Skeleton.Block className="h-24 w-full" />
    <Skeleton.Block className="h-24 w-full" />
  </div>
);

/**
 * 데이터를 읽는 화면의 상태 분기(FDD §13.3 E-C1~E-C6).
 * 오프라인이면 다른 상태보다 먼저 안내하고, 오류는 질책 없이 다시 시도만 준다(빨강 금지).
 */
export const ScreenState = ({
  status,
  children,
  skeleton,
  empty,
  error,
  forbidden,
}: ScreenStateProps) => {
  const online = useOnline();

  if (!online || status === 'offline') {
    return (
      <EmptyState
        role="status"
        title="인터넷 연결이 끊겼어요"
        description="연결되면 이어서 보여 드릴게요."
      />
    );
  }
  if (status === 'loading') return <>{skeleton ?? <DefaultSkeleton />}</>;
  if (status === 'forbidden') {
    return (
      <EmptyState
        title={forbidden?.title ?? '이 화면은 볼 수 없어요'}
        description={
          forbidden?.description ?? '볼 수 있는 계정으로 들어와 주세요.'
        }
      />
    );
  }
  if (status === 'error') {
    return (
      <EmptyState
        role="alert"
        title={error?.title ?? '불러오지 못했어요'}
        description="잠시 뒤에 다시 시도해 주세요."
        action={
          error?.onRetry && (
            <Button
              variant="secondary"
              size="compact"
              onClick={error.onRetry}
            >
              다시 시도
            </Button>
          )
        }
      />
    );
  }
  if (status === 'empty' && empty) {
    return (
      <EmptyState
        title={empty.title}
        description={empty.description}
        action={empty.action}
      />
    );
  }
  return <>{children}</>;
};
