import { notFound } from 'next/navigation';

import { StudentDetailPage } from '@/features/teaching-lesson/components/student-detail/student-detail-page';
import { StudentReviewSummary } from '@/features/teaching-lesson/components/student-review-summary';
import { assertDashboardRole } from '@/shared/lib/assert-dashboard-role';
import {
  isMvpHShellEnabled,
  isMvpHSliceEnabled,
} from '@/shared/lib/mvp-h-slice';

type PageProps = {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ roomId?: string }>;
};

export default async function TeacherStudentPage({
  params,
  searchParams,
}: PageProps) {
  // 기능 플래그가 꺼져 있으면 새 URL 도 열지 않는다(N-1).
  if (!isMvpHSliceEnabled()) notFound();
  await assertDashboardRole('ROLE_TEACHER');
  const { studentId } = await params;
  const id = Number(studentId);
  // mvp-h shell: 켜면 학생 상세(요약 칩·2주·노트·막힌 곳·빠른 피드백), 끄면 복습 요약만.
  if (isMvpHShellEnabled()) {
    const { roomId } = await searchParams;
    const room = Number(roomId);
    return (
      <StudentDetailPage
        studentId={id}
        roomId={Number.isInteger(room) && room > 0 ? room : undefined}
      />
    );
  }
  return <StudentReviewSummary studentId={id} />;
}
