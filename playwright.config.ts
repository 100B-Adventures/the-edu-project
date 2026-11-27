import { defineConfig, devices } from '@playwright/test';

import { loadE2eSecrets } from './e2e/helpers/load-e2e-secrets';

loadE2eSecrets();

const configuredBaseURL = process.env.E2E_BASE_URL?.trim();
const e2eWebPort = process.env.E2E_WEB_PORT?.trim() || '3000';
const localE2eURL = `http://localhost:${e2eWebPort}`;
const e2eBaseURL = configuredBaseURL || localE2eURL;
const useRemoteWeb = Boolean(configuredBaseURL);
process.env.E2E_BASE_URL = e2eBaseURL;

// mvp-e v1.1 스펙은 playwright.devremote.config.ts 의 session 준비 단계(로그인 상태 파일 생성)와
// 전용 fixture 환경변수를 전제로 한다. 기본 설정으로 딸려 들어오면 준비 단계가 없어 전건 실패한다.
const DEVREMOTE_ONLY_SPECS =
  /mvp-e-(?:v11\.spec|auth-gate\.spec|session\.setup)\.ts/;

// 실제 서버 로그인을 수행해 QA 계정 세션을 점유하는 스펙 목록(파일 단위 실행 순서가 곧 배열 순서).
const SHARED_ACCOUNT_SPECS = [
  /login\.spec\.ts/,
  /open-challenge\.spec\.ts/,
  /social\.spec\.ts/,
  /mvp-g-v8-fixture-controls\.spec\.ts/,
  /mvp-g-v2-remote\.spec\.ts/,
  /mvp-g-qa8-roundtrip\.spec\.ts/,
  /mvp-g-qa8-performance\.spec\.ts/,
  /mvp-g-v8-3-delayed-filter\.spec\.ts/,
  /web-mobile-v12-phase2\.spec\.ts/,
];

// 폭별 전수 점검(v8-4)은 세 역할 계정을 모두 쓰고 실행 시간이 길다.
// 다른 스펙과 계정을 다투지 않게 별도 프로젝트로 떼어 두고, 기본 실행에서는 뺀다.
// 실행: --project=widths-v8-4 --workers=1
const WIDTHS_SPEC = /mvp-g-v8-4-widths\.spec\.ts/;

// 검색 입력 폭 회귀는 실제 관리자 로그인을 쓰지만 다른 스펙의
// 사전 성공을 필요로 하지 않는 독립 검사다. dependency chain에 넣으면
// 무관한 앞 스펙 실패 시 이 회귀 검사도 did not run이 된다.
// CI에서는 전역 workers=1이 공유 관리자 계정의 동시 로그인을 막는다.
const ADMIN_WIDTH_SPEC = /mvp-g-search-input-width\.spec\.ts/;

// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: e2eBaseURL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      // 실제 서버 로그인을 쓰지 않는 스펙. 계정을 공유하지 않으므로 병렬로 안전하다.
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: [
        DEVREMOTE_ONLY_SPECS,
        WIDTHS_SPEC,
        ADMIN_WIDTH_SPEC,
        ...SHARED_ACCOUNT_SPECS,
      ],
    },
    {
      name: 'widths-v8-4',
      use: { ...devices['Desktop Chrome'] },
      testMatch: WIDTHS_SPEC,
      fullyParallel: false,
    },
    {
      // 무관한 shared-account 스펙이 실패해도 반드시 독립 실행한다.
      name: 'admin-width-regression',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ADMIN_WIDTH_SPEC,
      fullyParallel: false,
      workers: 1,
    },
    // 아래는 같은 QA 계정으로 실제 서버 로그인을 하는 스펙들이다.
    // 백엔드가 회원 1명당 refresh token 을 1개만 보관하기 때문에(RefreshTokenRepositoryImpl),
    // 같은 계정으로 두 스펙이 동시에 로그인하면 먼저 로그인한 쪽 세션이 무효가 된다.
    // 그래서 파일 사이 순서를 dependencies 로 강제하고 파일 안에서도 직렬로 돌린다.
    ...SHARED_ACCOUNT_SPECS.map((testMatch, index) => ({
      name: `shared-account-${index + 1}`,
      use: { ...devices['Desktop Chrome'] },
      testMatch,
      fullyParallel: false,
      dependencies: index === 0 ? [] : [`shared-account-${index}`],
    })),
    {
      // 일반 PR에서도 실제 코치 경로를 필수 실행한다. 같은 학생 계정을 쓰는 기존
      // 스펙이 모두 끝난 뒤 전용 문제 번호와 직렬 worker로 실행해 상태 간섭을 막는다.
      name: 'coach',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /open-challenge\.spec\.ts/,
      grep: /AI 코치/,
      fullyParallel: false,
      dependencies: [`shared-account-${SHARED_ACCOUNT_SPECS.length}`],
    },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: useRemoteWeb
    ? undefined
    : {
        command: `npm run dev -- --hostname 127.0.0.1 --port ${e2eWebPort}`,
        url: localE2eURL,
        timeout: 600_000,
        // 다른 worktree의 앱을 제품 서버로 오인하지 않는다. 포트가 겹치면 즉시 실패시키고
        // 호출자가 E2E_WEB_PORT로 격리 포트를 명시한다.
        reuseExistingServer: false,
      },
});
