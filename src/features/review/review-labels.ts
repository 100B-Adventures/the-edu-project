/** N회독 화면 문구 사전. 서버는 코드만 주고 문구는 프론트가 가진다(api-contract §1.17). */

export const SITUATION_BUTTONS = [
  { key: 'NOT_FINISHED', label: '마무리 못 함' },
  { key: 'TOOK_LONG', label: '오래 걸림' },
  { key: 'CONCEPT_GAP', label: '개념 부족' },
  { key: 'NO_APPROACH', label: '접근 못 함' },
] as const;

export const SITUATION_ALL = 'ALL';

export const STUCK_REASON_LABEL: Record<string, string> = {
  TOOK_LONG: '오래 걸림',
  NO_APPROACH: '접근 못 함',
  NOT_FINISHED: '마무리 못 함',
  CONCEPT_GAP: '개념 부족',
  STOPPED_MIDWAY: '풀다 멈춤',
  EXPL_HARD: '해설도 어려움',
  CORRECT_BUT_AGAIN: '맞았지만 다시',
};

/** 풀이노트 라벨 4종(AC-60q). 학생이 지울 수 없는 계산값. */
export const NOTE_LABEL_TEXT: Record<string, string> = {
  SUBMITTED_BEFORE_EXPLANATION: '해설 보기 전 제출',
  SUBMITTED_AFTER_EXPLANATION: '해설 보고 낸 풀이',
  TOOK_LONG: '오래 걸림',
  EMPTY_SUBMISSION: '빈 제출',
};

export const MAX_REVIEWS_FALLBACK = 5;
