import type { Metadata } from 'next';

import { NotesPage } from '@/features/unit-note/components/odokgong/notes-page';
import { UnitNoteLibrary } from '@/features/unit-note/components/unit-note-library';
import { isMvpHShellEnabled } from '@/shared/lib/mvp-h-slice';

export const metadata: Metadata = {
  title: '나의 단권화 | 대치동',
  description: '선생님 판서와 내 필기, 관련 오답을 개념별로 쌓는 단권화',
};

// mvp-h shell: 켜면 내 노트(과목 칩·겹친 묶음), 끄면 기존 단권화 라이브러리 그대로.
const StudentUnitNotesPage = () =>
  isMvpHShellEnabled() ? <NotesPage /> : <UnitNoteLibrary />;

export default StudentUnitNotesPage;
