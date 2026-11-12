import { expect, test } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const fixtureDir = path.join(process.cwd(), 'e2e/fixtures/course-consult-cta');
const evidenceDir = path.join(
  process.cwd(),
  'docs/qa/evidence/course-consult-cta-v2.0.23'
);

const readFixture = (name: string) =>
  readFile(path.join(fixtureDir, name), 'utf8');

test.describe('코스 유료 티어 상담 CTA', () => {
  test('TC-V2023-E2E-001 운영 데이터 화면은 주문 없이 상담으로 연결된다', async ({
    page,
  }) => {
    test.setTimeout(90_000);

    const [courseFixture, productsFixture] = await Promise.all([
      readFixture('course-1000.json'),
      readFixture('course-1000-products.json'),
    ]);
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const courseOrderPosts: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('request', (request) => {
      if (
        request.method() === 'POST' &&
        request.url().includes('/common/course-orders')
      ) {
        courseOrderPosts.push(request.url());
      }
    });

    await page.route('**/api/v1/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 200, message: '성공입니다.', data: {} }),
      })
    );
    await page.route('**/api/v1/common/courses/1000/lessons', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 200, message: '성공입니다.', data: [] }),
      })
    );
    await page.route('**/api/v1/public/courses/1000', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: courseFixture,
      })
    );
    await page.route('**/api/v1/public/courses/1000/products', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: productsFixture,
      })
    );

    await mkdir(evidenceDir, { recursive: true });

    for (const width of [390, 834, 1280]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.goto('/courses/1000');

      const consultationLinks = page.getByTestId('course-tier-consult-link');
      await expect(consultationLinks).toHaveCount(3);
      await expect(page.getByText('결제는 상담 뒤 안내')).toHaveCount(3);
      await expect(page.getByText('129,000원')).toBeVisible();
      await expect(page.getByText('190,000원')).toBeVisible();
      await expect(page.getByText('790,000원')).toBeVisible();
      await expect(page.getByText('이 티어로 시작하기')).toHaveCount(0);
      await expect(
        page.getByText(/주문번호|PG사 미정|미검증|dev\/stage/)
      ).toHaveCount(0);

      for (const link of await consultationLinks.all()) {
        await expect(link).toHaveAttribute('href', '/consult');
        const box = await link.boundingBox();
        expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
      }

      const viewportMetrics = await page.evaluate(() => ({
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
      }));
      expect(viewportMetrics.documentWidth).toBeLessThanOrEqual(
        viewportMetrics.viewportWidth
      );
      expect(viewportMetrics.bodyWidth).toBeLessThanOrEqual(
        viewportMetrics.viewportWidth
      );

      if (width === 390 || width === 1280) {
        await page.screenshot({
          path: path.join(evidenceDir, `course-1000-${width}.png`),
          fullPage: true,
        });
      }
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/courses/1000');
    await page.getByTestId('course-tier-consult-link').first().click();
    await expect(page).toHaveURL(/\/consult$/);

    expect(courseOrderPosts).toHaveLength(0);
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });
  test('TC-V2023-E2E-002 쿠키 없는 POST /api/v1/auth/sign-up 은 로그인으로 307 되지 않는다', async ({
    request,
  }) => {
    const response = await request.post('/api/v1/auth/sign-up', {
      data: {},
      maxRedirects: 0,
      failOnStatusCode: false,
    });
    // 백엔드가 없으면 프록시 단계 5xx 는 허용한다. 307 /login 이면 실패.
    expect(response.status()).not.toBe(307);
    expect(response.headers()['location'] ?? '').not.toContain('/login');
  });
});
