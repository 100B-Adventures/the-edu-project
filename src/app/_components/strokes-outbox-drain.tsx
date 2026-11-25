'use client';

import { useEffect } from 'react';

import { startOutboxDrain } from '@/entities/handwriting';
import { useSession } from '@/providers/session/session-context';
import { isMvpHSliceEnabled } from '@/shared/lib/mvp-h-slice';

/**
 * 로그인한 동안 앱 전체에서 손글씨 획 재업로드 보관함을 비운다(교차 리뷰 2회차 P1-6).
 * 풀이노트 화면이 아니라 루트 레이아웃에 두어, 백지 결과 뒤 N회독 홈 같은 어느 화면에 있어도 돈다.
 * mvp-h 스위치가 꺼져 있으면 아무것도 하지 않는다. 화면에는 아무것도 그리지 않는다.
 */
export const StrokesOutboxDrain = () => {
  const { status } = useSession();

  useEffect(() => {
    if (status !== 'authenticated' || !isMvpHSliceEnabled()) return;
    return startOutboxDrain();
  }, [status]);

  return null;
};
