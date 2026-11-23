import { notFound } from 'next/navigation';

import { ShareMetaView } from '@/features/teaching-lesson/components/share-meta-view';
import { isMvpHSliceEnabled } from '@/shared/lib/mvp-h-slice';

type PageProps = { params: Promise<{ token: string }> };

export default async function TeachingNoteSharePage({ params }: PageProps) {
  // 기능 플래그가 꺼져 있으면 새 URL 도 열지 않는다(N-1).
  if (!isMvpHSliceEnabled()) notFound();
  const { token } = await params;
  return <ShareMetaView token={token} />;
}
