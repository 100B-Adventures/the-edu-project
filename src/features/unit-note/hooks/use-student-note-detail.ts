import { repository, unitNoteKeys } from '@/entities/unit-note';
import { useQuery } from '@tanstack/react-query';

/** N7: 선생님이 같은 방 학생의 노트 한 단원을 읽는다. studentId 가 0 이면 부르지 않는다. */
export const useStudentNoteDetailQuery = (studentId: number, nodeId: number) =>
  useQuery({
    queryKey: unitNoteKeys.studentDetail(studentId, nodeId),
    queryFn: () => repository.getStudentLibrary(studentId, nodeId),
    enabled: studentId > 0 && nodeId > 0,
    retry: false,
  });
