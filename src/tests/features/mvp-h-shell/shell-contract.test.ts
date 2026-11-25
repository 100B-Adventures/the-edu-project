import { shellKeys } from '@/entities/shell';
import { buildShellNav } from '@/features/app-shell/model/nav-config';
import { shellTitleForPath } from '@/features/app-shell/model/shell-title';
import { pickTodayAction } from '@/features/today/model/pick-today-action';
import { isMvpHShellEnabled } from '@/shared/lib/mvp-h-slice';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('T-SHL-A 앱 셸 계약', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('T-SHL-A1 명시 스위치와 preview 기본값만 셸을 연다', () => {
    vi.stubEnv('NEXT_PUBLIC_MVPH_SHELL', 'on');
    expect(isMvpHShellEnabled()).toBe(true);

    vi.stubEnv('NEXT_PUBLIC_MVPH_SHELL', 'off');
    expect(isMvpHShellEnabled()).toBe(false);

    vi.stubEnv('NEXT_PUBLIC_MVPH_SHELL', '');
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'preview');
    expect(isMvpHShellEnabled()).toBe(true);

    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'production');
    expect(isMvpHShellEnabled()).toBe(false);
  });

  it('T-SHL-A2 조각 1이 꺼지면 새 수업노트와 N회독 죽은 링크가 없다', () => {
    const student = buildShellNav({
      role: 'ROLE_STUDENT',
      track: 'ONE',
      roomId: 7,
      sliceOneEnabled: false,
    });
    const teacher = buildShellNav({
      role: 'ROLE_TEACHER',
      roomId: 7,
      sliceOneEnabled: false,
    });

    expect(student.sidebar.map(({ key }) => key)).not.toContain('review');
    expect(teacher.sidebar.map(({ key }) => key)).not.toContain('lesson');
    expect(student.sidebar.map(({ key }) => key)).toEqual([
      'home',
      'room',
      'notes',
      'growth',
    ]);
  });

  it('T-SHL-A3 조각 1이 켜지면 역할별 메뉴와 현재 화면 제목을 잇는다', () => {
    const student = buildShellNav({
      role: 'ROLE_STUDENT',
      track: 'ONE',
      roomId: 7,
      sliceOneEnabled: true,
    });
    const teacher = buildShellNav({
      role: 'ROLE_TEACHER',
      roomId: 7,
      sliceOneEnabled: true,
    });

    expect(student.sidebar.map(({ key }) => key)).toContain('review');
    expect(teacher.sidebar.map(({ key }) => key)).toContain('lesson');
    expect(
      shellTitleForPath('/dashboard/student/unit-notes/10', 'ROLE_STUDENT')
    ).toBe('내 노트');
    expect(
      shellTitleForPath('/dashboard/teacher/students/5', 'ROLE_TEACHER')
    ).toBe('학생 상세');
  });

  it('T-SHL-A4 역할이 다른 공지 조회는 캐시를 공유하지 않는다', () => {
    expect(shellKeys.notices('student', 7)).not.toEqual(
      shellKeys.notices('teacher', 7)
    );
  });

  it('T-SHL-A5 셸 OFF의 homework 상세는 기존 중첩 layout을 먼저 사용한다', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/app/(private)/study-rooms/[id]/layout.tsx'),
      'utf8'
    );
    const offGuard = source.indexOf(
      'if (!isMvpHShellEnabled() && isHomeworkRoute)'
    );
    expect(offGuard).toBeGreaterThan(-1);
    expect(offGuard).toBeLessThan(source.indexOf('if (isDetailPage)'));
  });

  it('T-SHL-A6 셸 코드가 지연 로딩되고 CSS와 메시지 모델이 기능 경계에 있다', () => {
    const appShell = readFileSync(
      join(process.cwd(), 'src/shared/components/app-shell/app-shell.tsx'),
      'utf8'
    );
    const globals = readFileSync(
      join(process.cwd(), 'src/styles/globals.css'),
      'utf8'
    );
    const quickMessage = readFileSync(
      join(
        process.cwd(),
        'src/features/teaching-lesson/components/student-detail/quick-message.tsx'
      ),
      'utf8'
    );
    expect(appShell).toContain("import dynamic from 'next/dynamic'");
    expect(appShell).toContain('const OdokgongShell = dynamic(');
    expect(globals).toContain("@import './mvp-h-shell.css'");
    expect(globals).not.toContain('data-odok-shell');
    expect(quickMessage).toContain("messageText } from '@/entities/shell'");
    expect(quickMessage).not.toContain('@/features/today');
  });

  it('T-SHL-A7 404, 학부모 공지, 보상 숫자가 shell 계약을 따른다', () => {
    const notFound = readFileSync(
      join(process.cwd(), 'src/app/not-found.tsx'),
      'utf8'
    );
    const noticePage = readFileSync(
      join(
        process.cwd(),
        'src/features/study-rooms/components/office/notice-page.tsx'
      ),
      'utf8'
    );
    const performance = readFileSync(
      join(
        process.cwd(),
        'src/features/performance/components/performance-page.tsx'
      ),
      'utf8'
    );
    expect(notFound).toContain('isMvpHShellEnabled');
    expect(noticePage).toContain('status="forbidden"');
    expect(performance).toContain('useAppPolicyQuery');
    expect(performance).toContain('scoreTable.solutionReviseExp');
  });
});

describe('T-SHL-B 오늘 한 가지 계약', () => {
  it('T-SHL-B1 선생님 할 일을 복습과 오늘 문제보다 먼저 고른다', () => {
    const action = pickTodayAction({
      todos: [
        {
          id: 3,
          title: '함수 과제',
          status: 'TODO',
          assignerRole: 'TEACHER',
          weekOf: '2026-11-23',
        },
      ],
      reviewDueCount: 2,
      firstProblem: { challengeId: 9, reason: '오늘의 추천' },
    });

    expect(action).toMatchObject({
      kind: 'TODO',
      cta: { todoId: 3 },
    });
  });

  it('T-SHL-B2 할 것이 없으면 질책 없이 N회독 다음 행동을 준다', () => {
    const action = pickTodayAction({
      todos: [],
      reviewDueCount: 0,
      firstProblem: null,
    });

    expect(action.kind).toBe('EMPTY');
    expect(action.title).not.toMatch(/밀림|놓침|실패/);
    expect(action.cta.href).toBe('/dashboard/student/review');
  });

  it('T-SHL-A12 조각 1이 꺼지면 N회독 대신 살아 있는 내 노트 행동을 준다', () => {
    const action = pickTodayAction({
      todos: [],
      reviewEnabled: false,
      reviewDueCount: 3,
      firstProblem: null,
    });

    expect(action.kind).toBe('EMPTY');
    expect(action.cta).toEqual({
      label: '내 노트 보기',
      href: '/dashboard/student/unit-notes',
    });
  });
});
