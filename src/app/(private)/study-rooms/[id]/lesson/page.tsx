import { notFound } from 'next/navigation';

import { LessonPage } from '@/features/teaching-lesson/components/lesson-page';
import { isMvpHSliceEnabled } from '@/shared/lib/mvp-h-slice';

type PageProps = { params: Promise<{ id: string }> };

export default async function StudyRoomLessonPage({ params }: PageProps) {
  // 기능 플래그가 꺼져 있으면 새 URL 도 열지 않는다(N-1).
  if (!isMvpHSliceEnabled()) notFound();
  const { id } = await params;
  return <LessonPage studyRoomId={Number(id)} />;
}
