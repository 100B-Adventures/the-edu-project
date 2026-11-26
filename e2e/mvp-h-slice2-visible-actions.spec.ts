import { type Page, expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { okBody } from './helpers/api-mock';
import { setAuthCookie } from './helpers/auth-mock';

const phase = process.env.MVP_H_EVIDENCE_PHASE === 'off' ? 'off' : 'on';
const evidenceDir =
  process.env.MVP_H_EVIDENCE_DIR ?? '/tmp/dedu-slice2-evidence';
const widths = [390, 1024, 1440] as const;

const student = {
  id: 7,
  email: 'slice2-student@test.com',
  name: '조각2 학생',
  role: 'ROLE_STUDENT',
};

const teacher = {
  id: 8,
  email: 'slice2-teacher@test.com',
  name: '조각2 선생님',
  role: 'ROLE_TEACHER',
};

const responseFor = (url: URL, role: 'student' | 'teacher') => {
  if (url.pathname.endsWith('/member/info')) {
    return role === 'student' ? student : teacher;
  }
  if (url.pathname.includes('/notification/')) return [];
  if (url.pathname.endsWith('/members/profile-image')) {
    return { imageUrl: '', expiresAt: '2026-11-27T00:00:00' };
  }
  if (url.pathname.endsWith('/common/points')) {
    return { balance: 1200, transactions: [] };
  }
  if (url.pathname.endsWith('/student/todos')) {
    return {
      weekOf: '2026-11-23',
      weekEnd: '2026-11-29',
      totalCount: 0,
      doneCount: 0,
      skippedCount: 0,
      items: [],
    };
  }
  if (url.pathname.endsWith('/student/review/overview')) {
    return {
      today: '2026-11-26',
      reviewDay: 1,
      me: { level: 1, exp: 0, expToNext: 100, source: 'FIXTURE' },
      curve: {
        buckets: [],
        dueNow: 0,
        soonForget: { tomorrow: 0, dayAfter: 0 },
      },
    };
  }
  if (url.pathname.endsWith('/student/daily-problems')) {
    return {
      queueDate: '2026-11-26',
      backlogCount: 0,
      onboarding: false,
      items: [],
      handoff: { returnUrl: '/dashboard/student', origin: 'DAILY_PROBLEM' },
    };
  }
  if (url.pathname.endsWith('/student/messages')) return { items: [] };
  if (url.pathname.endsWith('/student/schedule')) {
    return {
      blocks: [
        {
          id: 1,
          date: '2026-11-26',
          startMin: 1080,
          endMin: 1140,
          track: 'TEACHER',
          title: '수학 오답 정리',
          plannedMinutes: 60,
          actualMinutes: 0,
          todoId: null,
          treeNodeId: null,
        },
        {
          id: 2,
          date: '2026-11-26',
          startMin: 1090,
          endMin: 1160,
          track: 'ACADEMY',
          title: '학원 숙제',
          plannedMinutes: 70,
          actualMinutes: 0,
          todoId: null,
          treeNodeId: null,
        },
      ],
    };
  }
  if (url.pathname.endsWith('/student/year-events')) {
    return [
      {
        id: 9,
        kind: 'EXAM',
        title: '2학기 기말고사',
        startsOn: '2026-12-14',
        endsOn: null,
        targetGrade: '2',
      },
    ];
  }
  if (url.pathname.includes('/unit-notes/pages/33/references')) return [];
  if (url.pathname.includes('/unit-notes/11/pages/33/versions')) {
    return { id: 41, versionNo: 2 };
  }
  if (url.pathname.endsWith('/teacher/dashboard/study-rooms')) return [];
  return {};
};

const mockApi = async (page: Page, role: 'student' | 'teacher') => {
  await setAuthCookie(page);
  await page.route('**/api/v1/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: okBody(responseFor(new URL(route.request().url()), role)),
    });
  });
};

const screenshot = async (page: Page, screen: string, width: number) => {
  mkdirSync(evidenceDir, { recursive: true });
  await page.screenshot({
    path: path.join(evidenceDir, `${phase}-${screen}-${width}.png`),
    fullPage: true,
  });
};

const collectConsoleErrors = (page: Page) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
};

test.describe('MVP-H 조각 2 실렌더·실클릭', () => {
  test('학생 시간표 탭은 보이고 눌리며 세 폭에서 렌더된다', async ({
    page,
  }) => {
    const consoleErrors = collectConsoleErrors(page);
    await mockApi(page, 'student');

    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/dashboard/student');
      await expect(page.locator('body')).toBeVisible();
      await screenshot(page, 'student-today', width);

      if (phase === 'on') {
        const week = page.getByRole('tab', { name: '이번 주' });
        await expect(week).toBeVisible();
        expect((await week.boundingBox())?.width ?? 0).toBeGreaterThan(0);
        await week.click();
        await expect(page.getByTestId('week-grid')).toBeVisible();
        await screenshot(page, 'student-week', width);

        const year = page.getByRole('tab', { name: '연간' });
        await expect(year).toBeVisible();
        await year.click();
        await expect(
          page.getByRole('heading', { name: /학습 지도/ })
        ).toBeVisible();
        await screenshot(page, 'student-year', width);
      }
    }
    expect(consoleErrors).toEqual([]);
  });

  test('노트 쓰기 셸은 보기 전환과 저장 버튼이 실제로 눌린다', async ({
    page,
  }) => {
    test.skip(
      phase === 'off',
      '플래그 OFF에서는 신규 노트 쓰기 주소를 노출하지 않는다.'
    );
    const consoleErrors = collectConsoleErrors(page);
    await mockApi(page, 'student');

    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/dashboard/student/unit-notes/11/write?pageId=33');
      const input = page.getByLabel('필기 판');
      await expect(input).toBeVisible();
      await input.fill('등차수열은 공차가 일정한 수열이다.');
      const split = page.getByRole('tab', { name: '반반' });
      await expect(split).toBeVisible();
      await split.click();
      await page.getByRole('button', { name: '새 판 저장' }).click();
      await expect(page.getByText('판 2 저장됨')).toBeVisible();
      await screenshot(page, 'note-write', width);
    }
    expect(consoleErrors).toEqual([]);
  });

  test('선생님 상단 바의 주간 사용 정보와 프로필 메뉴가 실제로 보이고 눌린다', async ({
    page,
  }) => {
    const consoleErrors = collectConsoleErrors(page);
    await mockApi(page, 'teacher');

    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/dashboard/teacher');
      const profile = page.getByRole('button', { name: '내 정보' });
      await expect(profile).toBeVisible();
      expect((await profile.boundingBox())?.width ?? 0).toBeGreaterThan(0);
      await profile.click();
      await expect(
        page.getByRole('menuitem', { name: '로그아웃' })
      ).toBeVisible();
      if (phase === 'on' && width >= 1024) {
        await expect(page.getByText('이번 주 사용')).toBeVisible();
        await expect(page.getByText(/0분/)).toBeVisible();
      }
      await screenshot(page, 'teacher-dashboard', width);
    }
    expect(consoleErrors).toEqual([]);
  });
});
