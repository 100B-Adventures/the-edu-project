import { StudentResultsPage } from '@/features/dashboard/components/student/student-results-page';
import { PerformancePage } from '@/features/performance/components/performance-page';
import { isMvpHShellEnabled } from '@/shared/lib/mvp-h-slice';

export default function StudentResultsRoute() {
  // mvp-h shell: 켜면 내 성과(기간 탭), 끄면 기존 성과 화면 그대로.
  return isMvpHShellEnabled() ? <PerformancePage /> : <StudentResultsPage />;
}
