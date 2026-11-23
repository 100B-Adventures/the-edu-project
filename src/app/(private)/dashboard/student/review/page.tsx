import { notFound } from 'next/navigation';

import { ReviewHome } from '@/features/review/components/review-home';
import { isMvpHSliceEnabled } from '@/shared/lib/mvp-h-slice';

export default function StudentReviewPage() {
  // 기능 플래그가 꺼져 있으면 새 URL 도 열지 않는다(N-1).
  if (!isMvpHSliceEnabled()) notFound();
  return <ReviewHome />;
}
