#!/usr/bin/env node
/*
 * 광고 픽셀 제외 회귀 검사 (2026-11-06). 실제 브라우저로 Meta(facebook.com/tr)·당근(collect.daangn.com)
 * 요청을 센다. 운영 빌드(NEXT_PUBLIC_APP_ENV=production)를 대상으로 돌린다.
 *
 *   node scripts/verify-ad-pixels.mjs [BASE_URL]
 *   AD_PIXEL_STUB=1 이면 픽셀 수집 요청을 외부로 내보내지 않고 응답을 흉내 낸다(운영 전 로컬 검사).
 *   E2E_STUDENT_EMAIL·E2E_STUDENT_PASSWORD 가 있으면 실제 학생 로그인까지 확인한다.
 */
import { chromium } from '@playwright/test';
import { gunzipSync } from 'node:zlib';

const BASE = (process.argv[2] ?? 'https://hongong.today').replace(/\/$/, '');
const STUB = process.env.AD_PIXEL_STUB === '1';
const FAKE = 'qa-fake-token-20261106';
// Meta 스크립트는 HeadlessChrome UA 를 봇으로 보고 tr 요청을 안 보낸다(2026-11-06 실측). 일반 UA 로 재야 한다.
const USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

const classify = (url) => {
  if (/facebook\.com\/(tr|privacy_sandbox)/.test(url)) return 'meta';
  if (/collect\.daangn\.com/.test(url)) return 'karrot';
  if (/connect\.facebook\.net/.test(url)) return 'metaJs';
  if (/karrot-pixel/.test(url)) return 'karrotJs';
  if (/google-analytics\.com|googletagmanager\.com/.test(url)) return 'ga4';
  if (/clarity\.ms/.test(url)) return 'clarity';
  return null;
};

const browser = await chromium.launch({ headless: true });
const results = [];
let failed = 0;

const open = async ({ member, cookie } = {}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: USER_AGENT,
  });
  if (cookie) {
    await context.addCookies([
      { name: 'Authorization', value: cookie, url: BASE },
    ]);
  }
  if (member) {
    await context.route('**/api/v1/member/info', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 200, message: 'ok', data: member }),
      })
    );
  }
  if (STUB) {
    await context.route(
      /facebook\.com\/(tr|privacy_sandbox)|collect\.daangn\.com/,
      (route) => route.fulfill({ status: 200, body: '' })
    );
  }
  const page = await context.newPage();
  const state = {
    hits: [],
    errors: [],
    tokenLeaks: new Set(),
    thirdParty: new Set(),
  };
  const base = new URL(BASE).host;
  page.on('request', (request) => {
    // 토큰이 자사 밖으로 나가는지 URL·본문(gzip 포함)을 전부 본다. Clarity 는 gzip 본문으로 보낸다.
    const host = new URL(request.url()).host;
    if (host !== base) {
      state.thirdParty.add(host);
      const buffer = request.postDataBuffer();
      let body = '';
      if (buffer) {
        try {
          body = gunzipSync(buffer).toString();
        } catch {
          body = buffer.toString();
        }
      }
      let decoded = request.url();
      try {
        decoded = decodeURIComponent(decoded);
      } catch {}
      if (decoded.includes(FAKE) || body.includes(FAKE))
        state.tokenLeaks.add(host);
    }
    const kind = classify(request.url());
    if (kind) state.hits.push({ kind, url: request.url() });
  });
  page.on('pageerror', (error) =>
    state.errors.push(`pageerror: ${error.message}`)
  );
  page.on('console', (message) => {
    if (message.type() === 'error') state.errors.push(message.text());
  });
  return { context, page, state };
};

const count = (state, kind) =>
  state.hits.filter((hit) => hit.kind === kind).length;
const settle = (page) => page.waitForTimeout(6000);

const record = (name, state, finalUrl, expect) => {
  const meta = count(state, 'meta');
  const karrot = count(state, 'karrot');
  const js = count(state, 'metaJs') + count(state, 'karrotJs');
  const leaked = state.hits.some(
    (hit) =>
      (hit.kind === 'meta' || hit.kind === 'karrot') && hit.url.includes(FAKE)
  );
  const ok =
    expect === 'on'
      ? meta > 0 && karrot > 0 && !leaked
      : meta + karrot + js === 0;
  if (!ok) failed += 1;
  results.push({
    name,
    finalPath: new URL(finalUrl).pathname + new URL(finalUrl).search,
    expect,
    meta,
    karrot,
    pixelJs: js,
    ga4: count(state, 'ga4'),
    clarity: count(state, 'clarity'),
    tokenLeakHosts: [...state.tokenLeaks],
    consoleErrors: state.errors.length,
    errorSample: state.errors.slice(0, 2).map((text) => text.slice(0, 140)),
    pass: ok,
  });
};

const visit = async (name, path, expect, options) => {
  const { context, page, state } = await open(options);
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
  await settle(page);
  record(name, state, page.url(), expect);
  await context.close();
};

await visit('공개 랜딩 /', '/', 'on');
await visit('공개 랜딩 UTM', '/?utm_source=qa', 'on');
await visit('코스 목록', '/courses', 'on');
await visit('자동 수집 도구 안내', '/privacy/tracking', 'on');
await visit('가입', '/register', 'on');

for (const path of [
  '/dashboard/student',
  '/dashboard/student/exam-hall',
  '/learning',
  '/tree',
  '/points',
  '/friends',
  '/onboarding',
  '/study-note/new',
  '/courses/1/learn',
  '/profile/student/1',
  '/open-challenge/1',
  '/login',
  `/invite/${FAKE}`,
  `/invite/challenge/${FAKE}`,
  `/invite?token=${FAKE}`,
  `/register?token=${FAKE}`,
  `/login?token=${FAKE}`,
  `/select-role?token=${FAKE}`,
  `/select-role?redirect=${encodeURIComponent(`/invite/challenge/${FAKE}`)}`,
]) {
  await visit(`제외 ${path.replace(FAKE, 'TOKEN')}`, path, 'off');
}

const student = { id: 1, email: 'qa@example.com', role: 'ROLE_STUDENT' };
const teacher = { id: 2, email: 'qa@example.com', role: 'ROLE_TEACHER' };
const parent = { id: 3, email: 'qa@example.com', role: 'ROLE_PARENT' };
const under14 = {
  ...parent,
  birthDate: `${new Date().getFullYear() - 10}-01-01`,
};

await visit('학생 세션 공개 랜딩(응답 모의)', '/courses', 'off', {
  member: student,
  cookie: 'qa',
});
await visit('선생님 세션 공개 화면(응답 모의)', '/courses', 'on', {
  member: teacher,
  cookie: 'qa',
});
await visit('학부모 세션 공개 화면(응답 모의)', '/courses', 'on', {
  member: parent,
  cookie: 'qa',
});
await visit('생년월일 14세 미만(응답 모의)', '/courses', 'off', {
  member: under14,
  cookie: 'qa',
});

// 공개 화면에서 켠 뒤 SPA 로 제외 경로에 가면 그 주소가 나가지 않고 픽셀이 메모리에서 사라져야 한다.
{
  const { context, page, state } = await open();
  await page.goto(`${BASE}/privacy/tracking`, {
    waitUntil: 'domcontentloaded',
  });
  await settle(page);
  const before = count(state, 'meta') + count(state, 'karrot');
  await page.evaluate(
    (path) => window.next?.router?.push(path),
    `/invite/${FAKE}`
  );
  await settle(page);
  const leaked = state.hits.filter(
    (hit) =>
      (hit.kind === 'meta' || hit.kind === 'karrot') && hit.url.includes(FAKE)
  ).length;
  const after = count(state, 'meta') + count(state, 'karrot');
  const pixelGone = await page.evaluate(
    () => !window.fbq && !window.karrotPixel
  );
  const analyticsGone = await page.evaluate(
    () => !window.gtag && !window.clarity
  );
  const pass =
    before > 0 &&
    leaked === 0 &&
    after === before &&
    pixelGone &&
    analyticsGone &&
    state.tokenLeaks.size === 0 &&
    page.url().includes(FAKE);
  if (!pass) failed += 1;
  results.push({
    name: 'SPA 공개→초대 전환',
    before,
    after,
    leaked,
    pixelGone,
    analyticsGone,
    tokenLeakHosts: [...state.tokenLeaks],
    finalPath: new URL(page.url()).pathname.replace(FAKE, 'TOKEN'),
    pass,
  });

  // 초대 주소를 referrer 로 가진 전체 이동도 나가지 않아야 한다.
  state.hits.length = 0;
  await page.evaluate(() => {
    window.location.href = '/privacy/tracking';
  });
  await settle(page);
  const referrer = await page.evaluate(() => document.referrer);
  const referrerPass =
    referrer.includes(FAKE) &&
    count(state, 'meta') + count(state, 'karrot') === 0 &&
    state.tokenLeaks.size === 0;
  if (!referrerPass) failed += 1;
  results.push({
    name: '초대 주소 referrer 전체 이동',
    referrerHasToken: referrer.includes(FAKE),
    meta: count(state, 'meta'),
    karrot: count(state, 'karrot'),
    pass: referrerPass,
  });
  await context.close();
}

// 공개 화면 사이 SPA 이동은 Meta PageView 가 한 번씩 나가야 한다.
{
  const { context, page, state } = await open();
  await page.goto(`${BASE}/privacy/tracking`, {
    waitUntil: 'domcontentloaded',
  });
  await settle(page);
  const pageViews = () =>
    state.hits.filter(
      (hit) => hit.kind === 'meta' && /[?&]ev=PageView/.test(hit.url)
    ).length;
  const before = pageViews();
  await page.evaluate(() => window.next?.router?.push('/courses'));
  await settle(page);
  const after = pageViews();
  const pass = before === 1 && after === 2;
  if (!pass) failed += 1;
  results.push({
    name: 'SPA 공개→공개 PageView',
    before,
    after,
    finalPath: new URL(page.url()).pathname,
    pass,
  });

  // 버튼 문구 자동 수집이 꺼졌는지 본다.
  state.hits.length = 0;
  await page
    .locator('button:visible')
    .first()
    .click({ timeout: 3000 })
    .catch(() => {});
  await page.waitForTimeout(2500);
  const inferred = state.hits.filter((hit) =>
    /SubscribedButtonClick/.test(hit.url)
  ).length;
  if (inferred) failed += 1;
  results.push({
    name: '버튼 문구 자동 수집 꺼짐',
    subscribedButtonClick: inferred,
    pass: inferred === 0,
  });
  await context.close();
}

// 실제 학생 로그인. 자격증명이 없으면 미검증으로 남긴다.
if (process.env.E2E_STUDENT_EMAIL && process.env.E2E_STUDENT_PASSWORD) {
  const { context, page, state } = await open();
  const login = await context.request.post(`${BASE}/api/v1/auth/login`, {
    data: {
      email: process.env.E2E_STUDENT_EMAIL,
      password: process.env.E2E_STUDENT_PASSWORD,
    },
  });
  if (login.ok()) {
    for (const path of ['/dashboard/student', '/learning', '/courses', '/']) {
      state.hits.length = 0;
      state.errors.length = 0;
      await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
      await settle(page);
      record(`실제 학생 로그인 ${path}`, state, page.url(), 'off');
    }
    const info = await context.request.get(`${BASE}/api/v1/member/info`);
    const body = await info.json().catch(() => null);
    results.push({
      name: '학생 회원 정보 응답 키(값 미출력)',
      keys: Object.keys(body?.data ?? {}),
      role: body?.data?.role,
    });
  } else {
    results.push({
      name: '실제 학생 로그인',
      status: login.status(),
      note: '이 환경에서 로그인 실패, 미검증',
    });
  }
  await context.close();
} else {
  results.push({ name: '실제 학생 로그인', note: '자격증명 없음, 미검증' });
}

await browser.close();
console.log(JSON.stringify(results, null, 1));
console.log(`\n실패 ${failed}건 / BASE=${BASE} / STUB=${STUB}`);
process.exit(failed ? 1 : 0);
