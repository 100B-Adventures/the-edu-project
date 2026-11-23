import { notFound } from 'next/navigation';

import { BlankRetry } from '@/features/review/components/blank-retry';
import { isMvpHSliceEnabled } from '@/shared/lib/mvp-h-slice';

type PageProps = { params: Promise<{ wrongAnswerId: string }> };

export default async function BlankRetryPage({ params }: PageProps) {
  // 기능 플래그가 꺼져 있으면 새 URL 도 열지 않는다(N-1).
  if (!isMvpHSliceEnabled()) notFound();
  const { wrongAnswerId } = await params;
  return <BlankRetry wrongAnswerId={Number(wrongAnswerId)} />;
}
