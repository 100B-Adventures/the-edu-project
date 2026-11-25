const STUDENT_TITLES: Array<[RegExp, string]> = [
  [/^\/dashboard\/student\/results\/?$/, '내 성과'],
  [/^\/dashboard\/student\/look-back\/?$/, '돌아보기'],
  [/^\/dashboard\/student\/(review|wrong-answers)(\/.*)?$/, 'N회독'],
  [/^\/dashboard\/student\/solution-notes(\/.*)?$/, '풀이노트'],
  [/^\/dashboard\/student\/unit-notes(\/.*)?$/, '내 노트'],
  [/^\/study-rooms\/\d+\/lesson(\/.*)?$/, '수업노트'],
  [/^\/study-rooms\/\d+\/notice\/?$/, '공지'],
  [/^\/study-rooms\/\d+(\/.*)?$/, '교무실'],
  [/^\/dashboard\/qna(\/.*)?$/, '질문'],
  [/^\/mypage(\/.*)?$/, '마이페이지'],
];

const TEACHER_TITLES: Array<[RegExp, string]> = [
  [/^\/dashboard\/teacher\/students\/\d+(\/.*)?$/, '학생 상세'],
  [/^\/dashboard\/teacher\/my\/?$/, '마이'],
  [/^\/study-rooms\/\d+\/lesson(\/.*)?$/, '수업노트'],
  [/^\/study-rooms\/\d+\/notice\/?$/, '공지'],
  [/^\/study-rooms\/\d+(\/.*)?$/, '교무실'],
];

/** 앱 틀 상단 바 제목. 역할별 규칙에 없으면 홈 이름을 쓴다. */
export const shellTitleForPath = (
  pathname: string,
  role: 'ROLE_STUDENT' | 'ROLE_TEACHER'
): string => {
  const table = role === 'ROLE_TEACHER' ? TEACHER_TITLES : STUDENT_TITLES;
  const matched = table.find(([pattern]) => pattern.test(pathname));
  if (matched) return matched[1];
  return role === 'ROLE_TEACHER' ? '학생 현황' : '내 학습';
};
