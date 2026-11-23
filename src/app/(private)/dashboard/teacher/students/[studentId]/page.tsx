import { assertDashboardRole } from '@/shared/lib/assert-dashboard-role';
import { StudentReviewSummary } from '@/features/teaching-lesson/components/student-review-summary';

type PageProps = { params: Promise<{ studentId: string }> };

export default async function TeacherStudentPage({ params }: PageProps) {
  await assertDashboardRole('ROLE_TEACHER');
  const { studentId } = await params;
  return <StudentReviewSummary studentId={Number(studentId)} />;
}
