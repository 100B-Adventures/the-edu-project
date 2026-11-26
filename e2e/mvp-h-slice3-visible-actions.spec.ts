import { type Page, expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { okBody } from './helpers/api-mock';
import { setAuthCookie } from './helpers/auth-mock';

const phase = process.env.MVP_H_EVIDENCE_PHASE === 'off' ? 'off' : 'on';
const evidenceDir =
  process.env.MVP_H_EVIDENCE_DIR ?? '/tmp/dedu-slice3-evidence';
const evidenceStamp =
  process.env.MVP_H_EVIDENCE_STAMP ?? 'v1.0.0-gpt-codex-20261127';
const widths = [390, 1024, 1440] as const;

test.setTimeout(240_000);

const student = {
  id: 7,
  email: 'slice3-student@test.com',
  name: '조각3 학생',
  role: 'ROLE_STUDENT',
};

const responseFor = (url: URL, method: string) => {
  const { pathname } = url;
  if (pathname.endsWith('/member/info')) return student;
  if (pathname.includes('/notification/')) return [];
  if (pathname.endsWith('/members/profile-image')) {
    return { imageUrl: '', expiresAt: '2026-11-28T00:00:00' };
  }
  if (pathname.endsWith('/student/me/track')) {
    return { track: 'PAID', primaryStudyRoomId: 3, studyRoomCount: 1 };
  }
  if (pathname.endsWith('/student/resume')) return { kind: 'NONE' };
  if (pathname.endsWith('/student/todos')) {
    return {
      weekOf: '2026-11-23',
      weekEnd: '2026-11-29',
      totalCount: 0,
      doneCount: 0,
      skippedCount: 0,
      items: [],
    };
  }
  if (pathname.endsWith('/student/schedule')) {
    return {
      blocks: [],
      defaultScope: { kind: 'WEEK', until: '2026-11-29' },
    };
  }
  if (pathname.endsWith('/student/daily-problems')) {
    return {
      queueDate: '2026-11-27',
      backlogCount: 0,
      onboarding: false,
      items: [],
      handoff: { returnUrl: '/dashboard/student', origin: 'DAILY_PROBLEM' },
    };
  }
  if (pathname.endsWith('/student/review/overview')) {
    return {
      today: '2026-11-27',
      reviewDay: 1,
      me: { level: 1, exp: 0, expToNext: 100, source: 'LEVEL' },
      quest: { items: [], expReward: 0 },
      curve: {
        buckets: [],
        dueNow: 0,
        soonForget: { tomorrow: 0, dayAfter: 0 },
      },
      situation: { total: 0, byReason: {} },
      unit: [],
    };
  }
  if (pathname.endsWith('/student/library')) {
    return [
      {
        ebookId: 3,
        title: '오독공 수학 실전편',
        previewChapterCount: 1,
        chapterCount: 8,
      },
    ];
  }
  if (pathname.endsWith('/public/library')) {
    return [
      {
        ebookId: 3,
        title: '오독공 수학 실전편',
        previewChapterCount: 1,
        chapterCount: 8,
      },
    ];
  }
  if (pathname.includes('/library/ebooks/3/chapters/1')) {
    return {
      ebookId: 3,
      chapterNo: 1,
      title: '풀이를 남기는 첫날',
      bodyHtml: '정답보다 막힌 식을 먼저 표시해 봅니다.',
    };
  }
  if (pathname.endsWith('/student/program')) {
    return {
      enrollmentId: 5,
      courseTitle: '오독공 58일 수학',
      status: 'ACTIVE',
      currentDay: 18,
      totalDays: 58,
      bufferCoupons: 2,
      coupons: [{ id: 7, expiresOn: '2026-12-31' }],
    };
  }
  if (pathname.endsWith('/student/program/days')) {
    return [
      {
        dayNo: 17,
        title: '17일차',
        status: 'MISSED',
        videoUnlocked: false,
        submitted: false,
        referenceAnchors: [],
        date: '2026-11-17',
        assignments: [],
        done: false,
      },
      {
        dayNo: 18,
        title: '18일차',
        status: 'OPEN',
        videoUnlocked: false,
        submitted: false,
        referenceAnchors: [],
        date: '2026-11-18',
        assignments: [],
        done: false,
      },
      {
        dayNo: 22,
        title: '22일차',
        status: 'LOCKED',
        videoUnlocked: false,
        submitted: false,
        referenceAnchors: [],
        date: '2026-11-22',
        assignments: [],
        done: false,
      },
    ];
  }
  if (pathname.endsWith('/student/program/days/18')) {
    return {
      dayNo: 18,
      title: '18일차',
      status: method === 'POST' ? 'SUBMITTED' : 'OPEN',
      videoUnlocked: method === 'POST',
      submitted: method === 'POST',
      referenceAnchors: method === 'POST' ? ['교재 쪽: 42'] : [],
      date: '2026-11-18',
      assignments: [
        {
          assignmentKey: 'NOTE:18',
          type: 'NOTE',
          challengeId: null,
          lessonId: null,
          status: method === 'POST' ? 'DONE' : 'TODO',
        },
      ],
      done: false,
    };
  }
  if (pathname.includes('/buffer-coupon')) {
    return {
      dayNo: 17,
      title: '17일차',
      status: 'OPEN',
      videoUnlocked: false,
      submitted: false,
      referenceAnchors: [],
      date: '2026-11-17',
      assignments: [],
      done: false,
    };
  }
  if (pathname.endsWith('/public/feed/1')) {
    return {
      id: 1,
      kind: 'NOTE',
      title: '등차수열에서 막힌 식',
      preview: '공차를 먼저 표시하니 다음 식이 보였어요.',
      cheers: 4,
      best: true,
    };
  }
  if (pathname.endsWith('/public/feed')) {
    const declaration = url.searchParams.get('kind') === 'DECLARATION';
    return declaration
      ? [
          {
            id: 2,
            kind: 'DECLARATION',
            title: '공부 의지 선언',
            preview: '오늘은 한 문제의 막힌 줄까지 남길게요.',
            cheers: 0,
            best: false,
          },
        ]
      : [
          {
            id: 1,
            kind: 'NOTE',
            title: '등차수열에서 막힌 식',
            preview: '공차를 먼저 표시하니 다음 식이 보였어요.',
            cheers: 4,
            best: true,
          },
        ];
  }
  if (pathname.endsWith('/student/declarations')) {
    return {
      id: 9,
      kind: 'PLEDGE',
      body: '오늘 한 문제를 끝까지 풀게요.',
      redactedPreview: '오늘 한 문제를 끝까지 풀게요.',
      visibility: 'PRIVATE',
      evalStatus: 'COMPLETED',
      evaluation: '시작할 시각을 정하고 첫 식부터 적어 보세요.',
    };
  }
  if (pathname.endsWith('/student/declarations/9/visibility')) {
    return {
      id: 9,
      kind: 'PLEDGE',
      body: '오늘 한 문제를 끝까지 풀게요.',
      redactedPreview: '오늘 한 문제를 끝까지 풀게요.',
      visibility: 'PUBLIC_ANON',
      evalStatus: 'COMPLETED',
      evaluation: '시작할 시각을 정하고 첫 식부터 적어 보세요.',
    };
  }
  if (pathname.endsWith('/teacher/best-candidates')) {
    return [
      {
        publicNoteId: 1,
        studentName: '김학생',
        title: '등차수열에서 막힌 식',
        preview: '공차를 먼저 표시했어요.',
        selected: false,
      },
    ];
  }
  if (pathname.endsWith('/public/courses/1')) {
    return {
      courseId: 1,
      title: '오독공 58일 수학',
      subject: 'MATH',
      description: '막힌 식을 남기는 58일',
      price: 280000,
      freeLessonCount: 1,
      published: true,
      lessonCount: 58,
    };
  }
  if (pathname.endsWith('/public/courses/1/products')) {
    return [
      {
        productId: 11,
        planType: 'SELF_PACED',
        price: 39000,
        refundGuaranteed: false,
        reviewManaged: false,
        best: false,
      },
      {
        productId: 12,
        planType: 'MANAGED',
        price: 280000,
        refundGuaranteed: true,
        reviewManaged: true,
        best: true,
      },
    ];
  }
  if (pathname.endsWith('/common/course-orders') && method === 'POST') {
    return {
      orderId: 21,
      orderKey: 'dedu_order_fixture',
      amount: 280000,
      courseTitle: '오독공 58일 수학',
      planType: 'MANAGED',
      pgProvider: 'TOSS',
      customerName: '조각3 학생',
    };
  }
  if (pathname.endsWith('/common/course-orders/confirm')) {
    return {
      orderId: 21,
      enrollmentId: 5,
      status: 'PAID',
      refundGuaranteed: true,
    };
  }
  return {};
};

const mockApi = async (page: Page) => {
  await setAuthCookie(page);
  await page.route('https://js.tosspayments.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: 'window.TossPayments = () => ({ payment: () => ({ requestPayment: async () => {} }) });',
    })
  );
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: okBody(responseFor(new URL(request.url()), request.method())),
    });
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

const screens = [
  ['home', '/'],
  ['level', '/level'],
  ['checkout', '/checkout?courseId=1&productId=12&ref=FRIEND58'],
  [
    'pay-done',
    '/pay-done?paymentKey=pay_test&orderId=dedu_order_fixture&amount=280000&type=program',
  ],
  ['library', '/library'],
  ['student-week', '/dashboard/student'],
  ['program-plan', '/dashboard/student/program'],
  ['program-day', '/dashboard/student/program/days/18'],
  ['public-sales', '/courses/1'],
  ['public-ebook', '/courses/1'],
  ['public-feed', '/community'],
  ['declaration', '/declarations/new'],
  ['public-note', '/community/notes/1'],
  ['public-worry', '/consult'],
  ['teacher-best', '/dashboard/teacher/best'],
] as const;

test.describe('MVP-H 조각 3 실렌더·실클릭', () => {
  test('12개 공개 화면·숨긴 레벨 화면과 기존 홈을 플래그 전후 세 폭에서 캡처한다', async ({
    page,
  }) => {
    const consoleErrors = collectConsoleErrors(page);
    await mockApi(page);

    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      for (const [name, target] of screens) {
        await page.goto(target);
        await expect(page.locator('body')).toBeVisible();
        expect(
          (await page.locator('body').boundingBox())?.width ?? 0
        ).toBeGreaterThan(0);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth
          )
        ).toBe(true);
        await screenshot(page, name, width);
      }
      process.stdout.write(
        `SLICE3_CAPTURE phase=${phase} width=${width} screens=${screens.length} overflow=0\n`
      );
    }
    expect(consoleErrors).toEqual([]);
  });

  test('핵심 버튼은 크기가 있고 클릭 결과가 바뀐다', async ({ page }) => {
    test.skip(phase === 'off', '플래그 OFF는 기존 화면 보존 캡처만 검증한다.');
    await mockApi(page);
    await page.setViewportSize({ width: 390, height: 900 });

    await page.goto('/checkout?courseId=1&productId=12&ref=FRIEND58');
    await expect(page.getByText(/친구 코드가 입력됐어요/)).toBeVisible();
    const order = page.getByRole('button', { name: '주문 내용 확인하기' });
    expect((await order.boundingBox())?.height ?? 0).toBeGreaterThan(0);
    await order.click();
    await expect(
      page.getByRole('button', { name: '토스 시험 결제로 이동' })
    ).toBeVisible();

    await page.goto('/dashboard/student/program');
    const coupon = page.getByRole('button', { name: '버퍼 쿠폰으로 열기' });
    expect((await coupon.boundingBox())?.width ?? 0).toBeGreaterThan(0);
    await coupon.click();
    await expect(page.getByText('현재 18일차')).toBeVisible();

    await page.goto('/declarations/new');
    await page
      .getByLabel('자기선언 내용')
      .fill('오늘 한 문제를 끝까지 풀게요.');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: '비공개로 저장하기' }).click();
    await expect(page.getByText('공개 전 가림 미리보기')).toBeVisible();

    await page.goto('/community');
    await page.getByRole('link', { name: '노트 보기' }).click();
    await expect(page).toHaveURL(/\/community\/notes\/1$/);
    await expect(
      page.getByRole('button', { name: '응원 보내기' })
    ).toBeVisible();
  });

  test('학생 로그인 착지와 1024 주간표 7열을 플래그 계약대로 직접 조작한다', async ({
    page,
  }) => {
    await mockApi(page);
    await page.setViewportSize({ width: 1024, height: 900 });

    await page.goto('/login');
    await expect(page).toHaveURL(
      phase === 'on' ? /\/dashboard\/student$/ : /\/learning$/
    );
    if (phase === 'off') return;

    const grid = page.getByTestId('week-grid');
    await expect(grid).toBeVisible();
    const layout = await grid.evaluate((viewport) => {
      const cards = Array.from(viewport.querySelectorAll('article'));
      const last = cards.at(-1)?.getBoundingClientRect();
      const bounds = viewport.getBoundingClientRect();
      return {
        count: cards.length,
        fits: Boolean(last && last.right <= bounds.right + 1),
        overflow: viewport.scrollWidth > viewport.clientWidth,
      };
    });
    expect(layout).toEqual({ count: 7, fits: true, overflow: false });

    const previous = page.getByRole('button', { name: '이전 주' });
    expect((await previous.boundingBox())?.height ?? 0).toBeGreaterThan(0);
    const range = page.locator('section[aria-label="이번 주 시간표"] strong');
    const before = await range.textContent();
    await previous.click();
    await expect(range).not.toHaveText(before ?? '');
  });
});
