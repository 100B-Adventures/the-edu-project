import { notFound } from 'next/navigation';

import { StudentReviewSummary } from '@/features/teaching-lesson/components/student-review-summary';
import { assertDashboardRole } from '@/shared/lib/assert-dashboard-role';
import { isMvpHSliceEnabled } from '@/shared/lib/mvp-h-slice';

type PageProps = { params: Promise<{ studentId: string }> };

export default async function TeacherStudentPage({ params }: PageProps) {
  // 기능 플래그가 꺼져 있으면 새 URL 도 열지 않는다(N-1).
  if (!isMvpHSliceEnabled()) notFound();
  await assertDashboardRole('ROLE_TEACHER');
  const { studentId } = await params;
  return <StudentReviewSummary studentId={Number(studentId)} />;
}
