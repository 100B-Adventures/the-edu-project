import { LessonPage } from '@/features/teaching-lesson/components/lesson-page';

type PageProps = { params: Promise<{ id: string }> };

export default async function StudyRoomLessonPage({ params }: PageProps) {
  const { id } = await params;
  return <LessonPage studyRoomId={Number(id)} />;
}
