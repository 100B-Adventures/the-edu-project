import { notFound } from 'next/navigation';

import { NoteViewer } from '@/features/unit-note/components/odokgong/note-viewer';
import { assertDashboardRole } from '@/shared/lib/assert-dashboard-role';
import { isMvpHShellEnabled } from '@/shared/lib/mvp-h-slice';

type PageProps = { params: Promise<{ studentId: string; nodeId: string }> };

/** 선생님이 같은 방 학생의 노트를 읽는 화면(읽기 전용). shell 스위치가 꺼져 있으면 열지 않는다. */
export default async function TeacherStudentNotePage({ params }: PageProps) {
  if (!isMvpHShellEnabled()) notFound();
  await assertDashboardRole('ROLE_TEACHER');
  const { studentId, nodeId } = await params;
  const student = Number(studentId);
  const node = Number(nodeId);
  if (!Number.isInteger(student) || student <= 0) notFound();
  if (!Number.isInteger(node) || node <= 0) notFound();
  return (
    <NoteViewer
      nodeId={node}
      studentId={student}
    />
  );
}
