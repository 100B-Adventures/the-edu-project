/** 오독공 홈 정적 문안. 서버 호출 없는 콘텐츠다(FDD §5.2). 첫 화면 문안은 a(기본)·b·c 중 하나를 고른다. */

export const HOME_HERO_COPY = {
  a: {
    eyebrow: '학원·인강 다니는 고1~고3 · 학부모',
    title: '학원도 인강도 다니는데\n성적은 왜 그대로일까',
    lead: '배운 걸 내 손으로 다시 써 봐야 내 것이 됩니다. 학원·인강은 그대로 두고, 그 뒤 58일을 오독공이 맡아요.',
  },
  b: {
    eyebrow: '학원·인강 다니는 고1~고3 · 학부모',
    title: '오늘 들은 수업,\n내 노트로 남았나요?',
    lead: '학원에서 본 프린트, 인강에서 본 풀이. 다시 안 쓰면 일주일 뒤엔 남지 않아요.',
  },
  c: {
    eyebrow: '학원·인강 다니는 고1~고3 · 학부모',
    title: '학원·인강만으로는 불안하다면\n배운 걸 내 것으로 만드는 58일',
    lead: '듣고 온 수업을 개념노트로 다시 쓰고, 문제는 혼자 끝까지 풀어요.',
  },
} as const;

export type HomeHeroVariant = keyof typeof HOME_HERO_COPY;
export const DEFAULT_HERO_VARIANT: HomeHeroVariant = 'a';

export const NOTE_SEARCH_CHIPS = [
  '미분계수',
  '도함수',
  '함수의 극한',
  '2027 6월 모평',
  '조건해석',
] as const;

export const STUDY_FLOW_FOUR = [
  { title: '개념노트', body: '듣고 온 수업을 내 손으로 다시 써요.' },
  {
    title: '풀이노트',
    body: '막힌 문제는 해설을 베끼지 않고 내 풀이를 고쳐요.',
  },
  { title: 'N회독', body: '잊을 때쯤 다시 풀어 내 것으로 굳혀요.' },
  { title: '선생님 확인', body: '선생님이 매일 노트를 보고 핀을 꽂아 줘요.' },
] as const;

export const PROGRAM_BOARD = {
  eyebrow: '58일 프로그램',
  title: '학원·인강에서 배운 걸\n58일 동안 내 손으로 다시 씁니다',
  cta: '58일 프로그램 보기',
} as const;
