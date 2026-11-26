import { type Page, expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { okBody } from './helpers/api-mock';
import { setAuthCookie } from './helpers/auth-mock';

const phase = process.env.MVP_H_EVIDENCE_PHASE === 'off' ? 'off' : 'on';
const evidenceDir =
  process.env.MVP_H_EVIDENCE_DIR ?? '/tmp/dedu-slice2-evidence';
const evidenceStamp =
  process.env.MVP_H_EVIDENCE_STAMP ?? 'v1.1.0-gpt-codex-20261126-2210';
const widths = [390, 1024, 1440] as const;

test.setTimeout(180_000);

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
      defaultScope: { kind: 'TODAY', until: '2026-11-26' },
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
  if (url.pathname.endsWith('/student/unit-notes')) {
    return {
      totalPages: 1,
      nodes: [],
      detail: {
        nodeId: 11,
        pages: [
          {
            pageId: 33,
            position: 1,
            source: 'PEN',
            fileName: 'slice2-note.png',
            mimeType: 'image/png',
            sizeBytes: 100,
            viewUrl: null,
            cover: true,
            hiddenByStudent: false,
            teacherId: null,
            teacherMemo: null,
            createdAt: '2026-11-26T12:00:00',
          },
        ],
        teachingLayers: [],
        relatedProblems: [],
      },
    };
  }
  if (url.pathname.endsWith('/student/unit-notes/pages/33/pins')) return [];
  if (url.pathname.includes('/unit-notes/pages/33/references')) return [];
  if (url.pathname.endsWith('/student/unit-notes/search')) {
    return { items: [], page: 0, hasNext: false };
  }
  if (url.pathname.includes('/unit-notes/11/pages/33/versions')) {
    return { id: 41, versionNo: 2 };
  }
  if (url.pathname.endsWith('/teacher/dashboard/study-rooms')) return [];
  return {};
};

const mockApi = async (page: Page, role: 'student' | 'teacher') => {
  const activityBodies: unknown[] = [];
  const pinBodies: unknown[] = [];
  await setAuthCookie(page);
  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url());
    if (
      url.pathname.endsWith('/student/activity-sessions') &&
      route.request().method() === 'POST'
    ) {
      activityBodies.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: okBody({ id: activityBodies.length, actualMinutes: 1 }),
      });
      return;
    }
    if (
      url.pathname.endsWith('/student/unit-notes/pages/33/pins') &&
      route.request().method() === 'POST'
    ) {
      const body = route.request().postDataJSON();
      pinBodies.push(body);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: okBody({
          id: pinBodies.length,
          versionNo: body.versionNo,
          x: body.x,
          y: body.y,
          body: body.body,
          status: 'OPEN',
          authorKind: 'STUDENT',
          createdAt: '2026-11-26T12:00:00',
        }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: okBody(responseFor(url, role)),
    });
  });
  return { activityBodies, pinBodies };
};

const screenshot = async (page: Page, screen: string, width: number) => {
  mkdirSync(evidenceDir, { recursive: true });
  await page.screenshot({
    path: path.join(
      evidenceDir,
      `${phase}-${screen}-${width}-${evidenceStamp}.png`
    ),
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

const expectNoPageOverflow = async (page: Page) => {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
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
      await expectNoPageOverflow(page);
      await screenshot(page, 'student-today', width);

      if (phase === 'on') {
        const week = page.getByRole('tab', { name: '이번 주' });
        await expect(week).toBeVisible();
        expect((await week.boundingBox())?.width ?? 0).toBeGreaterThan(0);
        await week.click();
        await expect(page.getByTestId('week-grid')).toBeVisible();
        await expectNoPageOverflow(page);
        await screenshot(page, 'student-week', width);

        const year = page.getByRole('tab', { name: '연간' });
        await expect(year).toBeVisible();
        await year.click();
        await expect(
          page.getByRole('heading', { name: /학습 지도/ })
        ).toBeVisible();
        await expect(page.getByTestId('year-month-row')).toHaveCount(12);
        await expectNoPageOverflow(page);
        await screenshot(page, 'student-year', width);
        process.stdout.write(
          `SLICE2_METRIC width=${width} yearRows=12 tabsClicked=2 overflow=0\n`
        );
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
    const observations = await mockApi(page, 'student');
    await page.addInitScript(() => localStorage.removeItem('odk.solve.dock'));

    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/dashboard/student/unit-notes/11/write?pageId=33');
      const input = page.getByLabel('필기 판');
      await expect(input).toBeVisible();
      const surface = page.getByTestId('solution-drawing-surface');
      const surfaceBox = await surface.boundingBox();
      expect(surfaceBox?.width ?? 0).toBeGreaterThan(0);
      if (surfaceBox) {
        await page.mouse.move(surfaceBox.x + 40, surfaceBox.y + 40);
        await page.mouse.down();
        await page.mouse.move(surfaceBox.x + 120, surfaceBox.y + 100, {
          steps: 5,
        });
        await page.mouse.up();
      }
      await input.fill('등차수열은 공차가 일정한 수열이다.');
      const split = page.getByRole('tab', { name: '반반' });
      await expect(split).toBeVisible();
      await split.click();
      await expect(split).toHaveAttribute('aria-selected', 'true');
      await page.getByRole('button', { name: '새 판 저장' }).click();
      await expect(page.getByText('판 2 저장됨')).toBeVisible();
      await expect
        .poll(() => observations.activityBodies.length)
        .toBe(widths.indexOf(width) + 1);

      await page.getByRole('button', { name: '개념노트' }).click();
      await page.getByRole('button', { name: '참고자료' }).click();
      await expect(page.getByTestId('docked-concept-note')).toBeVisible();
      await expect(page.getByTestId('docked-references')).toBeVisible();
      await page.getByRole('button', { name: '개념노트 창 떼기' }).click();
      const floating = page.getByTestId('floating-concept-note');
      await expect(floating).toBeVisible();
      await expect(
        page.getByRole('button', { name: /방향으로 창 크기 조절/ })
      ).toHaveCount(8);
      await page.getByRole('button', { name: '개념노트 전체 화면' }).click();
      const fullscreenBox = await floating.boundingBox();
      expect(fullscreenBox?.width ?? 0).toBeGreaterThanOrEqual(width - 1);
      await screenshot(page, 'note-write-fullscreen', width);
      await page
        .getByRole('button', { name: '개념노트 전체 화면 닫기' })
        .click();
      await page.getByRole('button', { name: '개념노트 창 붙이기' }).click();
      await expect(floating).toHaveCount(0);
      await expectNoPageOverflow(page);
      await screenshot(page, 'note-write', width);
      process.stdout.write(
        `SLICE2_METRIC width=${width} strokeSurfaceWidth=${Math.round(surfaceBox?.width ?? 0)} stackedPanels=2 resizeHandles=8 fullscreenWidth=${Math.round(fullscreenBox?.width ?? 0)} activityPosts=${observations.activityBodies.length} overflow=0\n`
      );
    }
    expect(consoleErrors).toEqual([]);
  });

  test('핀 작성 UI는 세 폭에서 보이고 실제 요청을 보낸다', async ({ page }) => {
    const consoleErrors = collectConsoleErrors(page);
    const observations = await mockApi(page, 'student');

    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/dashboard/student/unit-notes/11');
      const input = page.getByLabel('핀 내용');
      const button = page.getByRole('button', { name: '핀 달기' });
      if (phase === 'off') {
        await expect(input).toHaveCount(0);
        await expectNoPageOverflow(page);
        await screenshot(page, 'note-viewer-pin', width);
        process.stdout.write(
          `SLICE2_METRIC width=${width} pinPanel=0 pinPosts=0 overflow=0\n`
        );
        continue;
      }
      await expect(input).toBeVisible();
      await input.fill(`${width}폭 핀`);
      await expect(button).toBeEnabled();
      const inputBox = await input.boundingBox();
      const buttonBox = await button.boundingBox();
      expect(inputBox?.width ?? 0).toBeGreaterThan(0);
      expect(buttonBox?.width ?? 0).toBeGreaterThan(0);
      await button.click();
      await expect
        .poll(() => observations.pinBodies.length)
        .toBe(widths.indexOf(width) + 1);
      await expectNoPageOverflow(page);
      await screenshot(page, 'note-viewer-pin', width);
      process.stdout.write(
        `SLICE2_METRIC width=${width} pinInputWidth=${Math.round(inputBox?.width ?? 0)} pinButtonWidth=${Math.round(buttonBox?.width ?? 0)} pinPosts=${observations.pinBodies.length} overflow=0\n`
      );
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
      if (phase === 'off') {
        const firstRoom = page.getByRole('link', {
          name: '첫 스터디룸 만들기',
        });
        await expect(firstRoom).toBeVisible();
        expect((await firstRoom.boundingBox())?.width ?? 0).toBeGreaterThan(0);
        await firstRoom.click();
        await expect(page).toHaveURL(/\/study-rooms\/new$/);
        await page.goBack();
        await expect(
          page.getByRole('heading', { name: '내 수업' })
        ).toBeVisible();
      } else {
        const profile = page.getByRole('button', { name: '내 정보' });
        await expect(profile).toBeVisible();
        expect((await profile.boundingBox())?.width ?? 0).toBeGreaterThan(0);
        await profile.click();
        await expect(
          page.getByRole('menuitem', { name: '로그아웃' })
        ).toBeVisible();
      }
      if (phase === 'on' && width >= 1024) {
        const topBar = page.getByTestId('odok-top-bar');
        await expect(topBar.getByText('이번 주 사용')).toBeVisible();
        await expect(
          topBar.locator('b').filter({ hasText: '0분 / 30분' })
        ).toBeVisible();
      }
      await expectNoPageOverflow(page);
      await screenshot(page, 'teacher-dashboard', width);
    }
    expect(consoleErrors).toEqual([]);
  });
});
