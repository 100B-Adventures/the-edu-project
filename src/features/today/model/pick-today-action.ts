import { PRIVATE, PUBLIC } from '@/shared/constants';

export type TodayTodo = {
  id: number;
  title: string;
  status: 'TODO' | 'DONE' | 'SKIPPED' | 'NOT_DONE';
  assignerRole: 'SELF' | 'TEACHER';
  /** 주 시작 날짜 문자열(YYYY-MM-DD). 마감 필드가 없어 이 값으로 가까운 순을 가른다. */
  weekOf: string;
};

export type TodayInput = {
  todos: TodayTodo[];
  /** 조각 1이 꺼지면 N회독 조회·주소를 행동 후보에서 제외한다. */
  reviewEnabled?: boolean;
  /** 오늘 마감인 N회독 카드 수. */
  reviewDueCount: number;
  /** 오늘의 문제 큐 첫 항목. */
  firstProblem?: { challengeId: number | null; reason: string } | null;
};

export type TodayAction = {
  kind: 'TODO' | 'REVIEW' | 'PROBLEM' | 'EMPTY';
  title: string;
  subtitle?: string;
  /** 이동이면 href, 할 일 완료 표시면 todoId(화면이 완료 요청을 보낸다). */
  cta: { label: string; href?: string; todoId?: number };
};

/**
 * 오늘 할 일 하나를 고른다(FDD §5.3, AC-46a·c).
 * ①선생님이 준 할 일 중 가까운 것 ②오늘 마감 N회독 ③오늘의 문제 첫 항목 ④없으면 N회독 권유.
 * 밀린 일이 있어도 질책 어법을 쓰지 않는다(AC-46e).
 */
export const pickTodayAction = ({
  todos,
  reviewEnabled = true,
  reviewDueCount,
  firstProblem,
}: TodayInput): TodayAction => {
  const teacherTodo = todos
    .filter((todo) => todo.status === 'TODO' && todo.assignerRole === 'TEACHER')
    .sort((a, b) => a.weekOf.localeCompare(b.weekOf) || a.id - b.id)[0];
  if (teacherTodo) {
    return {
      kind: 'TODO',
      title: teacherTodo.title,
      subtitle: '선생님이 준 할 일이에요',
      cta: { label: '다 했어요', todoId: teacherTodo.id },
    };
  }
  if (reviewEnabled && reviewDueCount > 0) {
    return {
      kind: 'REVIEW',
      title: `오늘 다시 볼 문제 ${reviewDueCount}개`,
      subtitle: '잊기 전에 한 번 더 봐요',
      cta: { label: 'N회독 하기', href: PRIVATE.DASHBOARD.STUDENT_REVIEW },
    };
  }
  if (firstProblem?.challengeId) {
    return {
      kind: 'PROBLEM',
      title: '오늘의 문제 하나',
      subtitle: firstProblem.reason,
      cta: {
        label: '풀어보기',
        href: PUBLIC.OPEN_CHALLENGE.DETAIL(firstProblem.challengeId),
      },
    };
  }
  return {
    kind: 'EMPTY',
    title: '오늘은 받은 것도 할 일도 없어요',
    subtitle: reviewEnabled
      ? '어제 막힌 문제를 하나 다시 풀어 볼까요?'
      : '내 노트를 가볍게 훑어볼까요?',
    cta: reviewEnabled
      ? { label: 'N회독 하기', href: PRIVATE.DASHBOARD.STUDENT_REVIEW }
      : { label: '내 노트 보기', href: PRIVATE.DASHBOARD.UNIT_NOTES },
  };
};
