#!/usr/bin/env node
/**
 * mvp-h(오독공) 조각 1 스테이징 스모크.
 * 증거 두 가지: dev-health-200, smoke-happy-1pass (product-lane stages.build.dev_deploy).
 *
 *   dev-health-200      프론트 /login 이 200, (선택) 백엔드 헬스가 200
 *   smoke-happy-1pass   학생 1:1 풀이 제출 -> 풀이노트 -> 선생님 수업노트 공유 링크 -> 카톡 크롤러 og 메타, 1왕복
 *
 * 헤드리스 Chromium 으로만 돈다(보이는 창을 띄우지 않는다). 테스트 회원으로 돈다.
 * 값은 환경변수로만 받고 출력·로그에 비밀번호를 쓰지 않는다.
 *
 * 필수 환경변수
 *   STAGING_URL            예) https://<스테이징 프론트 주소>     (끝 슬래시 없이)
 *   MVPH_STUDENT_EMAIL     테스트 학생 계정
 *   MVPH_TEACHER_EMAIL     테스트 선생님 계정
 *   MVPH_PASSWORD          두 계정 공통 비밀번호(다르면 MVPH_STUDENT_PASSWORD, MVPH_TEACHER_PASSWORD)
 *   MVPH_CHALLENGE_ID      풀이할 객관식 오픈챌린지 id (선택지 첫 번째로 제출)
 *   MVPH_TEACHING_NOTE_ID  선생님이 공유 링크를 만들 수업노트 id (선생님 소유)
 * 선택
 *   STAGING_API_HEALTH_URL 예) https://<백엔드 주소>/api/admin/actuator/health
 *   PLAYWRIGHT_MODULE      playwright 위치(기본 mvp-front/node_modules)
 *
 * 종료 코드 0 = 둘 다 통과, 1 = 실패(어느 단계인지 출력).
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const env = (k, d) => process.env[k] ?? d;
const need = (k) => {
  const v = process.env[k];
  if (!v) {
    console.error(`FAIL 환경변수 ${k} 가 없습니다`);
    process.exit(1);
  }
  return v;
};

const BASE = need('STAGING_URL').replace(/\/$/, '');
const STUDENT = need('MVPH_STUDENT_EMAIL');
const TEACHER = need('MVPH_TEACHER_EMAIL');
const CHALLENGE = need('MVPH_CHALLENGE_ID');
const NOTE = need('MVPH_TEACHING_NOTE_ID');
const pw = (who) => env(`MVPH_${who}_PASSWORD`) ?? need('MVPH_PASSWORD');
const T = 60000;

const { chromium } = require(env('PLAYWRIGHT_MODULE', 'playwright'));
const results = [];
const pass = (name, detail = '') => {
  results.push({ name, ok: true });
  console.log(`PASS ${name} ${detail}`.trim());
};
const fail = (name, detail) => {
  results.push({ name, ok: false });
  console.log(`FAIL ${name} ${detail}`);
};

const login = async (browser, email, password) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: T });
  await page.getByTestId('login-email-input').fill(email);
  await page.getByTestId('login-password-input').fill(password);
  await page.getByTestId('login-submit-button').click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: T });
  return { ctx, page };
};

const draw = (page) =>
  page.locator('[data-testid="solution-drawing-surface"] canvas').first().evaluate((c) => {
    const r = c.getBoundingClientRect();
    const fire = (type, x, y, down) =>
      c.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true, cancelable: true, composed: true, pointerId: 7, pointerType: 'pen',
          isPrimary: true, clientX: r.left + x, clientY: r.top + y, pressure: down ? 0.5 : 0, buttons: down ? 1 : 0,
        })
      );
    fire('pointerdown', 60, 60, true);
    for (let i = 1; i <= 14; i++) fire('pointermove', 60 + i * 12, 60 + (i % 3) * 14, true);
    fire('pointerup', 230, 60, false);
  });

const browser = await chromium.launch({ headless: true });
try {
  // 1. dev-health-200
  const home = await fetch(`${BASE}/login`, { redirect: 'manual' });
  home.status === 200 ? pass('dev-health-200 프론트 /login', '200') : fail('dev-health-200 프론트 /login', `status ${home.status}`);
  const apiHealth = env('STAGING_API_HEALTH_URL');
  if (apiHealth) {
    const h = await fetch(apiHealth);
    h.status === 200 ? pass('dev-health-200 백엔드 헬스', '200') : fail('dev-health-200 백엔드 헬스', `status ${h.status}`);
  }

  // 2. 학생 1:1 풀이 -> 제출 -> 풀이노트
  const s = await login(browser, STUDENT, pw('STUDENT'));
  await s.page.goto(`${BASE}/open-challenge/${CHALLENGE}`, { waitUntil: 'domcontentloaded', timeout: T });
  await s.page.getByTestId('choice-option-0').click({ timeout: T });
  await draw(s.page);
  await s.page.getByTestId('challenge-submit-button').click();
  const agree = s.page.getByTestId('consent-agree');
  if (await agree.waitFor({ timeout: 15000 }).then(() => true, () => false)) await agree.click();
  await s.page.waitForURL(/\/dashboard\/student\/solution-notes\/\d+/, { timeout: T });
  await s.page.getByRole('region', { name: '내 풀이' }).waitFor({ timeout: T });
  pass('smoke 학생 제출 -> 풀이노트', s.page.url().replace(BASE, ''));
  await s.ctx.close();

  // 3. 선생님 공유 링크 1왕복 + 카톡 크롤러 메타
  const t = await login(browser, TEACHER, pw('TEACHER'));
  const res = await t.ctx.request.post(`${BASE}/api/v1/teacher/teaching-notes/${NOTE}/share-links`, { data: {} });
  if (!res.ok()) throw new Error(`공유 링크 생성 ${res.status()}`);
  const body = await res.json();
  const token = body?.data?.token ?? body?.token;
  if (!token) throw new Error('공유 링크 토큰 없음');
  pass('smoke 선생님 공유 링크 생성', `token 길이 ${token.length}`);
  await t.ctx.close();
  const html = await (await fetch(`${BASE}/s/${token}`, { headers: { 'User-Agent': 'kakaotalk-scrap/1.0' } })).text();
  const og = (p) => new RegExp(`<meta property="${p}" content="([^"]*)"`).exec(html)?.[1];
  og('og:title') && og('og:description') && og('og:image')
    ? pass('smoke 카톡 크롤러 og 메타', `title=${og('og:title')}`)
    : fail('smoke 카톡 크롤러 og 메타', 'og 태그 없음');
} catch (e) {
  fail('smoke 예외', String(e.message).split('\n')[0]);
} finally {
  await browser.close();
}
const ok = results.length > 0 && results.every((r) => r.ok);
console.log(ok ? 'RESULT PASS (dev-health-200, smoke-happy-1pass)' : 'RESULT FAIL');
process.exit(ok ? 0 : 1);
