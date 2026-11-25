import { DashboardRoleShell } from '@/features/dashboard/components/dashboard-role-shell';
import { DashboardStudentContainer } from '@/features/dashboard/components/dashboard-student-container';
import { TodayPage } from '@/features/today/components/today-page';
import { isMvpHShellEnabled } from '@/shared/lib/mvp-h-slice';

export default function StudentDashboardPage() {
  // mvp-h shell: 켜면 내 학습(오늘) 화면, 끄면 기존 대시보드 그대로.
  if (isMvpHShellEnabled()) {
    return (
      <DashboardRoleShell role="ROLE_STUDENT">
        <TodayPage />
      </DashboardRoleShell>
    );
  }
  return <DashboardStudentContainer />;
}
