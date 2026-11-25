import type { StudentTrack } from '@/entities/shell';
import { PRIVATE } from '@/shared/constants';

import { SHELL_CAPABILITIES, type ShellCapability } from './shell-capabilities';

export type NavIconName =
  | 'learn'
  | 'room'
  | 'notes'
  | 'review'
  | 'growth'
  | 'program'
  | 'students'
  | 'lesson'
  | 'best'
  | 'my'
  | 'more';

export type NavItem = {
  key: string;
  label: string;
  href: string;
  icon: NavIconName;
  /** 이 경로(정규식)에 있으면 눌린 항목이다. */
  match: RegExp;
  /** 하단 탭에서만 쓰는 짧은 이름(없으면 label). */
  tabLabel?: string;
};

export type ShellNav = {
  sidebar: NavItem[];
  tabs: NavItem[];
};

type NavContext = {
  role: 'ROLE_STUDENT' | 'ROLE_TEACHER';
  track?: StudentTrack;
  /** 학생 대표 방, 선생님 첫 방. 없으면 방 항목을 그리지 않는다(N-1 규칙). */
  roomId?: number | null;
  /** 조각 1 스위치. 끄면 N회독이 틀에서 빠진다. */
  sliceOneEnabled: boolean;
  capabilities?: Record<ShellCapability, boolean>;
};

const item = (
  key: string,
  label: string,
  href: string,
  icon: NavIconName,
  match: RegExp,
  tabLabel?: string
): NavItem => ({ key, label, href, icon, match, tabLabel });

const STUDENT_HOME = item(
  'home',
  '내 학습',
  PRIVATE.DASHBOARD.STUDENT,
  'learn',
  /^\/dashboard\/student\/?$/,
  '학습'
);
const NOTES = item(
  'notes',
  '내 노트',
  PRIVATE.DASHBOARD.UNIT_NOTES,
  'notes',
  /^\/dashboard\/student\/(unit-notes|solution-notes)(\/.*)?$/,
  '노트'
);
const REVIEW = item(
  'review',
  'N회독',
  PRIVATE.DASHBOARD.STUDENT_REVIEW,
  'review',
  /^\/dashboard\/student\/(review|wrong-answers)(\/.*)?$/
);
const GROWTH = item(
  'growth',
  '내 성과',
  PRIVATE.DASHBOARD.STUDENT_RESULTS,
  'growth',
  /^\/dashboard\/student\/(results|look-back)\/?$/,
  '성과'
);

const roomItem = (label: string, roomId: number): NavItem =>
  item(
    'room',
    label,
    PRIVATE.ROOM.DETAIL(roomId),
    'room',
    /^\/study-rooms\/\d+(\/.*)?$/
  );

/**
 * 역할·트랙별 사이드바와 하단 탭(FDD §5.1 표, 시안 _shell.js NAV 와 이름·순서 1:1).
 * 능력이 false 인 항목은 만들지 않는다. 조각 3 전에는 PAID 가 오지 않으므로 program 은 그리지 않는다.
 */
export const buildShellNav = ({
  role,
  track = 'FREE',
  roomId,
  sliceOneEnabled,
  capabilities = SHELL_CAPABILITIES,
}: NavContext): ShellNav => {
  if (role === 'ROLE_TEACHER') {
    const students = item(
      'students',
      '학생 현황',
      PRIVATE.DASHBOARD.TEACHER,
      'students',
      /^\/dashboard\/teacher(\/students(\/.*)?)?\/?$/,
      '학생'
    );
    const office = roomId ? roomItem('교무실', roomId) : null;
    const lesson =
      roomId && sliceOneEnabled
        ? item(
            'lesson',
            '수업노트',
            PRIVATE.ROOM.LESSON(roomId),
            'lesson',
            /^\/study-rooms\/\d+\/lesson(\/.*)?$/
          )
        : null;
    const best = capabilities.bestNotes
      ? item(
          'best',
          '이번 주 베스트',
          '/dashboard/teacher/best',
          'best',
          /^\/dashboard\/teacher\/best\/?$/
        )
      : null;
    const my = item(
      'my',
      '마이',
      PRIVATE.DASHBOARD.TEACHER_MY,
      'my',
      /^\/dashboard\/teacher\/my\/?$/
    );
    const core = [students, office, lesson, best].filter(
      (value): value is NavItem => value !== null
    );
    return { sidebar: core, tabs: [...core, my] };
  }

  const room = roomId ? roomItem('스터디룸', roomId) : null;
  const programItem =
    track === 'PAID' && capabilities.program
      ? item(
          'program',
          '58일 진행',
          '/dashboard/student/program',
          'program',
          /^\/dashboard\/student\/program(\/.*)?$/
        )
      : null;
  const review = sliceOneEnabled ? REVIEW : null;
  const sidebar = [
    STUDENT_HOME,
    programItem,
    room,
    NOTES,
    review,
    GROWTH,
  ].filter((value): value is NavItem => value !== null);

  // 하단 탭: FREE 는 방 탭이 없고(58일 탭은 조각 3 전까지 그리지 않음), ONE 은 스터디룸, PAID 는 교무실.
  const roomTab = track === 'PAID' ? roomItem('교무실', roomId ?? 0) : room;
  const tabs = [
    STUDENT_HOME,
    track === 'PAID' ? programItem : null,
    track === 'FREE' || !roomId ? null : roomTab,
    NOTES,
    review,
    GROWTH,
  ]
    .filter((value): value is NavItem => value !== null)
    .slice(0, 5);

  return { sidebar, tabs };
};
