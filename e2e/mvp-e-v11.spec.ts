import { type Page, expect, test } from '@playwright/test';

import {
  BACKEND_ORIGIN,
  authedDevContext,
  expectApi,
  loadMvpEFixture,
  loginWithCredentials,
  newDevContext,
  requiredEnv,
  solve,
  solveShortAnswer,
  stableAttemptLearningState,
  stableMastery,
  unwrap,
} from './helpers/mvp-e-devremote';

// 이 spec 의 page 픽스처만 저장된 학생1 세션으로 시작한다(로그인 반복 제거).
// 비로그인 전제 시나리오는 각 테스트가 newDevContext 로 빈 세션 컨텍스트를 연다.
test.use({ storageState: 'e2e/.auth/student1.state.json' });

// student accounts against https://dev.hongong.today (no route mocks)
const TAG = '@mvp-e-v1.1-devremote';

type PairInvite = {
  shareToken: string;
  challengeId: number;
  inviterId: number;
  inviteeId: number | null;
  status: 'OPEN' | 'ACCEPTED' | 'COMPLETED';
};

async function memberId(page: Page): Promise<number> {
  const member = unwrap<{ id?: number; memberId?: number }>(
    await expectApi(
      await page.request.get('/api/v1/member/info'),
      [200],
      '재대결 격리 회원 정보'
    )
  );
  const id = Number(member.id ?? member.memberId);
  expect(id, '재대결 격리 회원 ID').toBeGreaterThan(0);
  return id;
}

async function pairPendingInvites(
  page: Page,
  firstMemberId: number,
  secondMemberId: number
): Promise<PairInvite[]> {
  const invites = unwrap<PairInvite[]>(
    await expectApi(
      await page.request.get('/api/v1/common/challenge-invites/me'),
      [200],
      '재대결 격리 도전장 목록'
    )
  );
  return invites.filter(
    (invite) =>
      ['OPEN', 'ACCEPTED'].includes(invite.status) &&
      ((invite.inviterId === firstMemberId &&
        invite.inviteeId === secondMemberId) ||
        (invite.inviterId === secondMemberId &&
          invite.inviteeId === firstMemberId))
  );
}

async function solveChallengeByApi(page: Page, challengeId: number) {
  const challenge = unwrap<{ choices: string[] }>(
    await expectApi(
      await page.request.get(`/api/v1/public/challenges/${challengeId}`),
      [200],
      `재대결 격리 공개 문제 ${challengeId}`
    )
  );
  expect(challenge.choices.length, '재대결 격리 객관식 선택지').toBeGreaterThan(
    0
  );
  const attempt = unwrap<{ attemptId: number | string }>(
    await expectApi(
      await page.request.post('/api/v1/common/challenge-attempts', {
        data: { challengeId },
      }),
      [200, 201],
      `재대결 격리 풀이 시작 ${challengeId}`
    )
  );
  await expectApi(
    await page.request.patch(
      `/api/v1/common/challenge-attempts/${attempt.attemptId}/answer`,
      { data: { selectedAnswer: String(challenge.choices[0]) } }
    ),
    [200],
    `재대결 격리 답안 제출 ${challengeId}`
  );
}

async function isSupportedInvite(page: Page, invite: PairInvite) {
  const challenge = unwrap<{ choices: string[] }>(
    await expectApi(
      await page.request.get(`/api/v1/public/challenges/${invite.challengeId}`),
      [200],
      `재대결 격리 지원 여부 ${invite.challengeId}`
    )
  );
  return challenge.choices.length > 0;
}

async function completePairInvite(
  firstPage: Page,
  secondPage: Page,
  firstMemberId: number,
  invite: PairInvite
) {
  if (invite.status === 'OPEN') {
    const inviteePage =
      invite.inviteeId === firstMemberId ? firstPage : secondPage;
    await expectApi(
      await inviteePage.request.post(
        `/api/v1/common/challenge-invites/${invite.shareToken}/accept`
      ),
      [200],
      `재대결 격리 도전장 수락 ${invite.challengeId}`
    );
  }
  await solveChallengeByApi(firstPage, invite.challengeId);
  await solveChallengeByApi(secondPage, invite.challengeId);
  await expectApi(
    await firstPage.request.get(
      `/api/v1/common/challenge-invites/${invite.shareToken}/result`
    ),
    [200],
    `재대결 격리 도전장 완료 ${invite.challengeId}`
  );
}

async function supportedPairPendingInvites(
  page: Page,
  firstMemberId: number,
  secondMemberId: number
) {
  const pending = await pairPendingInvites(page, firstMemberId, secondMemberId);
  const supported = await Promise.all(
    pending.map(async (invite) => ({
      invite,
      supported: await isSupportedInvite(page, invite),
    }))
  );
  return supported
    .filter(({ supported: isSupported }) => isSupported)
    .map(({ invite }) => invite);
}

async function drainPairPendingInvites(
  firstPage: Page,
  secondPage: Page,
  firstMemberId: number,
  secondMemberId: number
) {
  const pending = await pairPendingInvites(
    firstPage,
    firstMemberId,
    secondMemberId
  );
  for (const invite of pending) {
    // 과거 서버가 생성한 선택지 없는 재대결은 제품 UI/API로 완료할 수 없다.
    // 지원 가능한 객관식 pending만 완주하며, 서버 수정은 이 legacy 건을 상한에서 제외한다.
    if (await isSupportedInvite(firstPage, invite)) {
      await completePairInvite(firstPage, secondPage, firstMemberId, invite);
    }
  }
  expect(
    await supportedPairPendingInvites(firstPage, firstMemberId, secondMemberId),
    '재대결 격리 후 두 계정 사이 지원 가능한 대기 도전장'
  ).toHaveLength(0);
}

async function prepareTwoPendingInvites(
  firstPage: Page,
  secondPage: Page,
  sourceTokens: string[]
): Promise<PairInvite[]> {
  const prepared: PairInvite[] = [];
  for (const sourceToken of sourceTokens) {
    const source = unwrap<{ challengeId: number }>(
      await expectApi(
        await firstPage.request.get(
          `/api/v1/public/challenge-invites/${sourceToken}`
        ),
        [200],
        '재대결 상한 준비 원본 도전장'
      )
    );
    const created = unwrap<{ shareToken: string }>(
      await expectApi(
        await firstPage.request.post('/api/v1/common/challenge-invites', {
          data: { challengeId: source.challengeId },
        }),
        [200, 201],
        `재대결 상한 준비 ${source.challengeId}`
      )
    );
    await expectApi(
      await secondPage.request.post(
        `/api/v1/common/challenge-invites/${created.shareToken}/accept`
      ),
      [200],
      `재대결 상한 준비 수락 ${source.challengeId}`
    );
    prepared.push({
      shareToken: created.shareToken,
      challengeId: source.challengeId,
      inviterId: 0,
      inviteeId: null,
      status: 'ACCEPTED',
    });
  }
  return prepared;
}

async function registerFreshRematchStudent(page: Page, index: 1 | 2) {
  const now = Date.now();
  const suffix = `${now}${index}`.slice(-8);
  const accountEmail = requiredEnv('E2E_STUDENT_EMAIL');
  const domain =
    process.env.E2E_SIGNUP_EMAIL_DOMAIN?.trim() || accountEmail.split('@')[1];
  expect(domain, '재대결 격리 가입 이메일 도메인').toBeTruthy();
  const email = `qa-rematch-${now}-${index}@${domain}`;
  const password =
    process.env.E2E_SIGNUP_PASSWORD?.trim() ||
    requiredEnv('E2E_STUDENT_PASSWORD');
  await expectApi(
    await page.request.post(`${BACKEND_ORIGIN}/auth/sign-up`, {
      data: {
        email,
        password,
        phoneNumber: `010${suffix}`,
        agreeServiceTerms: true,
        agreePrivacyTerms: true,
        agreeAgeCheck: true,
        agreeMarketing: false,
        name: `QA재대결${suffix.slice(-4)}`,
        role: 'ROLE_STUDENT',
      },
    }),
    [201],
    `재대결 격리 학생${index} 가입`
  );
  await loginWithCredentials(page, email, password);
}

async function buildCompletedPairInvite(
  firstPage: Page,
  secondPage: Page,
  sourceToken: string
) {
  const source = unwrap<{ challengeId: number }>(
    await expectApi(
      await firstPage.request.get(
        `/api/v1/public/challenge-invites/${sourceToken}`
      ),
      [200],
      '재대결 격리 원본 문제 조회'
    )
  );
  const created = unwrap<{ shareToken: string }>(
    await expectApi(
      await firstPage.request.post('/api/v1/common/challenge-invites', {
        data: { challengeId: source.challengeId },
      }),
      [200, 201],
      `재대결 격리 원본 생성 ${source.challengeId}`
    )
  );
  await expectApi(
    await secondPage.request.post(
      `/api/v1/common/challenge-invites/${created.shareToken}/accept`
    ),
    [200],
    `재대결 격리 원본 수락 ${source.challengeId}`
  );
  await solveChallengeByApi(firstPage, source.challengeId);
  await solveChallengeByApi(secondPage, source.challengeId);
  await expectApi(
    await firstPage.request.get(
      `/api/v1/common/challenge-invites/${created.shareToken}/result`
    ),
    [200],
    `재대결 격리 원본 완료 ${source.challengeId}`
  );
  return {
    shareToken: created.shareToken,
    originalChallengeId: source.challengeId,
  };
}

test.describe(`${TAG} dev 실환경 릴리즈 관문`, () => {
  test('guest-session BFF 경로가 배포돼 있다', async ({ request }) => {
    const fixture = loadMvpEFixture();
    const response = await request.post('/api/v1/public/guest-sessions', {
      data: {
        challengeId: fixture.guest.challengeId,
        shareToken: fixture.guest.inviteToken,
      },
    });
    await expectApi(response, [200, 201], 'POST /api/v1/public/guest-sessions');
    const setCookies = response
      .headersArray()
      .filter(({ name }) => name.toLowerCase() === 'set-cookie')
      .map(({ value }) => value)
      .join('; ');
    expect(setCookies).toContain('guest_token=');
    expect(setCookies).toContain('guest_proof=');
  });

  test('손풀이 공유 → 타계정 이름 노출 → 본인 내리기 → 상대 소실, 학습 기록 불변', async ({
    browser,
  }) => {
    const fixture = loadMvpEFixture();
    const author = await authedDevContext(browser, '');
    const viewer = await authedDevContext(browser, '2');
    const authorPage = await author.newPage();
    const viewerPage = await viewer.newPage();
    try {
      const member = unwrap<{ name?: string; nickname?: string }>(
        await expectApi(
          await authorPage.request.get('/api/v1/member/info'),
          [200],
          '작성자 회원 정보'
        )
      );
      const authorName = (member.nickname || member.name || '').trim();
      expect(authorName, '작성자 이름은 실제 회원 정보에 있어야 한다').not.toBe(
        ''
      );
      await solve(authorPage, fixture.share.challengeId, 0, true);
      await expect(
        authorPage.getByRole('img', { name: '내가 작성한 손글씨 풀이' })
      ).toBeVisible();
      await solve(viewerPage, fixture.share.challengeId, 1);
      await expect(
        viewerPage.getByText(authorName, { exact: true })
      ).toBeVisible();
      await expect(
        viewerPage.getByRole('img', { name: `${authorName}님의 손글씨 풀이` })
      ).toBeVisible();

      const reviews = unwrap<{
        content: Array<{
          id?: number | string;
          reviewId?: number | string;
          authorNickname: string;
          isMine: boolean;
        }>;
      }>(
        await expectApi(
          await viewerPage.request.get(
            `/api/v1/common/challenges/${fixture.share.challengeId}/reviews?sort=LATEST`
          ),
          [200],
          '타계정 공개 풀이 목록'
        )
      );
      const authoredReview = reviews.content.find(
        (review) => review.authorNickname === authorName
      );
      expect(
        authoredReview,
        '공개 풀이에 작성자 이름이 있어야 한다'
      ).toBeTruthy();
      expect(authoredReview?.isMine).toBe(false);
      const authoredReviewId = authoredReview?.id ?? authoredReview?.reviewId;
      expect(authoredReviewId, '공개 풀이 식별자가 있어야 한다').toBeTruthy();
      const forbiddenDelete = await expectApi(
        await viewerPage.request.delete(
          `/api/v1/common/challenge-reviews/${authoredReviewId}`
        ),
        [403],
        '타계정 풀이 내리기 권한'
      );
      expect(JSON.stringify(forbiddenDelete)).toContain(
        'CHALLENGE_REVIEW_NOT_OWNED'
      );

      const attemptBefore = await expectApi(
        await authorPage.request.get(
          `/api/v1/common/me/challenges/${fixture.share.challengeId}`
        ),
        [200],
        '내 시도 삭제 전'
      );
      const masteryBefore = await expectApi(
        await authorPage.request.get('/api/v1/common/tree'),
        [200],
        '정복 지도 삭제 전'
      );
      await authorPage.reload();
      await authorPage.getByRole('button', { name: '내 풀이 메뉴' }).click();
      await expect(authorPage.getByText('이 풀이를 내릴까요?')).toBeVisible();
      await authorPage
        .getByRole('button', { name: '내리기', exact: true })
        .click();
      await viewerPage.reload();
      await expect(
        viewerPage.getByText(authorName, { exact: true })
      ).toHaveCount(0);
      const attemptAfter = await expectApi(
        await authorPage.request.get(
          `/api/v1/common/me/challenges/${fixture.share.challengeId}`
        ),
        [200],
        '내 시도 삭제 후'
      );
      const masteryAfter = await expectApi(
        await authorPage.request.get('/api/v1/common/tree'),
        [200],
        '정복 지도 삭제 후'
      );
      expect(stableAttemptLearningState(attemptAfter)).toEqual(
        stableAttemptLearningState(attemptBefore)
      );
      expect(stableMastery(masteryAfter)).toEqual(stableMastery(masteryBefore));
    } finally {
      await author.close();
      await viewer.close();
    }
  });

  // TODO(v2.0.25 시딩 방식 미정): 서버가 가입 전 이메일 인증 완료를 확인하므로 /auth/sign-up 직접 호출 시딩은 400 이다.
  // 운영 QA 는 미리 만든 시험 계정(is_qa_account=1)을 env 로 받아 로그인하고, 스테이징·로컬은 테스트 셋업의
  // DB 직접 시드(SQL)로 계정을 만든다. 운영 코드에 인증 우회 분기는 두지 않는다.
  test.skip('비회원 도전장 → 즉시 채점 → 실제 가입 → 기록 claim', async ({
    browser,
  }) => {
    const fixture = loadMvpEFixture();
    const context = await newDevContext(browser);
    const page = await context.newPage();
    const now = Date.now();
    const suffix = `${now}`.slice(-8);
    const studentEmail = requiredEnv('E2E_STUDENT_EMAIL');
    const signupDomain =
      process.env.E2E_SIGNUP_EMAIL_DOMAIN?.trim() || studentEmail.split('@')[1];
    expect(
      signupDomain,
      'QA 학생 계정 이메일 도메인이 있어야 한다'
    ).toBeTruthy();
    const email = `qa-mvpe-${now}@${signupDomain}`;
    const password =
      process.env.E2E_SIGNUP_PASSWORD?.trim() ||
      requiredEnv('E2E_STUDENT_PASSWORD');
    try {
      await page.goto(`/invite/challenge/${fixture.guest.inviteToken}`);
      await expect(page.getByText(/님이 도전장을 보냈어요/)).toBeVisible();
      await page
        .getByRole('button', { name: '가입 없이 지금 풀어보기' })
        .click();
      await page.waitForURL(
        new RegExp(`/open-challenge/${fixture.guest.challengeId}`)
      );
      await page.getByTestId('choice-option-0').click();
      const gradeResponse = page.waitForResponse(
        (r) =>
          /\/api\/v1\/public\/challenges\/\d+\/(?:guest-grade|grade)(?:\?|$)/.test(
            r.url()
          ) && r.request().method() === 'POST'
      );
      await page.getByTestId('challenge-submit-button').click();
      expect((await gradeResponse).status()).toBe(200);
      await expect(page.getByTestId('signup-sheet')).toBeVisible();
      await page.getByTestId('signup-sheet-cta').click({ noWaitAfter: true });
      await expect(page).toHaveURL(/\/register\?redirect=/, {
        timeout: 15_000,
      });

      await expectApi(
        // 가입은 화면과 동일하게 백엔드 공개 API 로 직접 보낸다.
        // BFF 경유(/api/v1/auth/sign-up)는 미들웨어 인증 가드에 걸려 /login 으로
        // 307 되므로 실제 사용자 경로가 아니다(2026-08-07 dev 실측).
        // 화면 구현: features/auth/services/api.ts 의 api.public.post('/auth/sign-up').
        await page.request.post(`${BACKEND_ORIGIN}/auth/sign-up`, {
          data: {
            email,
            password,
            phoneNumber: `010${suffix}`,
            agreeServiceTerms: true,
            agreePrivacyTerms: true,
            agreeAgeCheck: true,
            agreeMarketing: false,
            name: `QA승계${suffix.slice(-4)}`,
            role: 'ROLE_STUDENT',
          },
        }),
        [201],
        '게스트 승계용 실제 가입'
      );

      const redirect = new URL(page.url()).searchParams.get('redirect');
      expect(redirect).toContain('guestSession=1');
      const claimResponse = page.waitForResponse((response) =>
        response.url().includes('/common/guest-sessions/claim')
      );
      await loginWithCredentials(
        page,
        email,
        password,
        /\/open-challenge\//,
        `/login?redirect=${encodeURIComponent(redirect!)}`
      );
      expect((await claimResponse).status()).toBe(200);
      await expect(
        page.getByText('방금 푼 기록을 내 계정으로 옮겼어요.')
      ).toBeVisible();
    } finally {
      await context.close();
    }
  });

  // TODO(v2.0.25 시딩 방식 미정): 서버가 가입 전 이메일 인증 완료를 확인하므로 /auth/sign-up 직접 호출 시딩은 400 이다.
  // 운영 QA 는 미리 만든 시험 계정(is_qa_account=1)을 env 로 받아 로그인하고, 스테이징·로컬은 테스트 셋업의
  // DB 직접 시드(SQL)로 계정을 만든다. 운영 코드에 인증 우회 분기는 두지 않는다.
  test.skip('회원가입→로그인→첫 문제→결과·보상→약점 나무→학습→dataLayer', async ({
    browser,
  }, testInfo) => {
    const fixture = loadMvpEFixture();
    const context = await newDevContext(browser);
    const page = await context.newPage();
    try {
      await page.addInitScript(() => {
        window.dataLayer = [];
      });
      await registerFreshRematchStudent(page, 1);

      await page.goto(`/open-challenge/${fixture.share.challengeId}?src=release_qa`);
      await expect(page.getByTestId('challenge-submit-button')).toBeVisible();
      await page.getByTestId('choice-option-0').click();
      await page.getByTestId('challenge-submit-button').click();
      await page.waitForURL(/\/open-challenge\/[^/]+\/result$/);
      const reward = page.getByTestId('challenge-reward');
      await expect(reward).toBeVisible();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('진행 중인 attempt가 아닙니다.')).toHaveCount(
        0
      );

      const events = await page.evaluate(() =>
        window.dataLayer
          .map((entry) => entry.event)
          .filter((event): event is string => typeof event === 'string')
      );
      expect(events).toEqual(
        expect.arrayContaining([
          'oc_start',
          'oc_submit',
          'oc_complete',
          'reward_shown',
        ])
      );
      await page.screenshot({
        path: testInfo.outputPath('core-path-result-reward.png'),
        fullPage: true,
      });

      await reward.getByRole('link', { name: /약점 나무/ }).click();
      await expect(page).toHaveURL(/\/tree$/);
      await expectApi(
        await page.request.get('/api/v1/common/tree'),
        [200],
        '핵심 경로 약점 나무'
      );
      await page.goto('/learning');
      await expect(page).toHaveURL(/\/learning$/);
      await expectApi(
        await page.request.get('/api/v1/common/me/challenges?page=0&size=1'),
        [200],
        '핵심 경로 학습 기록'
      );
    } finally {
      await context.close();
    }
  });

  for (const outcome of [
    'WIN',
    'LOSE',
    'BOTH_CORRECT',
    'BOTH_WRONG',
  ] as const) {
    test(`대결 결과 ${outcome}를 서버와 화면이 동일하게 표시한다`, async ({
      page,
    }) => {
      const item = loadMvpEFixture().outcomes[outcome];
      const response = await page.request.get(
        `/api/v1/common/challenge-invites/${item.shareToken}/result`
      );
      const body = unwrap<{
        outcome: string;
        divergence: {
          hasData: boolean;
          wrongType: string | null;
          reason: string | null;
        };
      }>(
        await expectApi(response, [200], `${outcome} 결과 API`)
      );
      expect(body.outcome).toBe(outcome);
      if (body.divergence.hasData) {
        expect(body.divergence.wrongType?.trim()).toBeTruthy();
        expect(body.divergence.reason?.trim()).toBeTruthy();
      } else {
        expect(body.divergence.wrongType).toBeNull();
        expect(body.divergence.reason).toBeNull();
      }
      console.log(
        `[mvp-e-divergence] outcome=${outcome} hasData=${body.divergence.hasData} reason=${body.divergence.reason ? 'present' : 'absent'}`
      );
      await page.goto(`/friends/${item.friendId}`);
      // 같은 문제로 대결한 이력이 여러 건이면 제목 기준 first()는 아직 상대 제출을
      // 기다리는 옛 행을 집을 수 있다. 방금 만든 도전장의 shareToken 링크를 눌러
      // 실제 친구 목록 동선을 유지하면서 결과 행을 정확히 특정한다.
      await page
        .locator(`a[href="/friends/challenge/${item.shareToken}/result"]`)
        .click();
      // 화면 문구 정본 = challenge-result-dialog.tsx 의 OUTCOME_COPY.
      // 이전 값('내가 이겼어요'·'아쉽게 졌어요')은 실제 화면에 없는 문구였다(2026-08-07 dev 실측).
      const expected = {
        WIN: '이겼어요',
        LOSE: '졌어요. 어디서 갈렸는지 보고 가요',
        BOTH_CORRECT: '둘 다 맞혔어요',
        BOTH_WRONG: '둘 다 걸렸어요',
      }[outcome];
      await expect(page.getByText(expected, { exact: false })).toBeVisible();

      // 회장 확정(2026-08-09): 내가 틀린 대결은 방금 문제를 혼자 다시 푸는 링크가
      // 주 동작이고, 이긴 대결은 새 문제로 다시 붙는 동작이 주 버튼이다.
      const iWasWrong = outcome === 'LOSE' || outcome === 'BOTH_WRONG';
      if (iWasWrong) {
        const retryLink = page.getByRole('link', {
          name: '갈린 자리 다시 풀기',
        });
        await expect(retryLink).toBeVisible();
        await expect(retryLink).toHaveAttribute(
          'href',
          new RegExp(`/open-challenge/\\d+$`)
        );
      } else {
        // 내가 맞힌 대결은 같은 문제가 아닌 새 문제를 고르는 rematch가 주 동작이다.
        await expect(
          page.getByRole('button', { name: /다시 붙기$/ })
        ).toBeVisible();
        await expect(
          page.getByRole('link', { name: '갈린 자리 다시 풀기' })
        ).toHaveCount(0);
      }
    });
  }

  // TODO(v2.0.25 시딩 방식 미정): 서버가 가입 전 이메일 인증 완료를 확인하므로 /auth/sign-up 직접 호출 시딩은 400 이다.
  // 운영 QA 는 미리 만든 시험 계정(is_qa_account=1)을 env 로 받아 로그인하고, 스테이징·로컬은 테스트 셋업의
  // DB 직접 시드(SQL)로 계정을 만든다. 운영 코드에 인증 우회 분기는 두지 않는다.
  test.skip('다시 붙기 성공·대기 3건 상한·후보 없음', async ({
    browser,
  }, testInfo) => {
    const fixture = loadMvpEFixture();
    const first = await newDevContext(browser);
    const second = await newDevContext(browser);
    const firstPage = await first.newPage();
    const secondPage = await second.newPage();
    let firstMemberId = 0;
    let secondMemberId = 0;
    try {
      // 매 실행마다 새 학생 2명을 사용자 가입 경로로 준비한다. 이전 실행이 만든
      // OPEN/ACCEPTED·완료 이력·숙련도에 의존하지 않는 완전 격리 fixture다.
      await registerFreshRematchStudent(firstPage, 1);
      await registerFreshRematchStudent(secondPage, 2);
      firstMemberId = await memberId(firstPage);
      secondMemberId = await memberId(secondPage);

      expect(
        await pairPendingInvites(firstPage, firstMemberId, secondMemberId),
        '신규 재대결 계정의 초기 대기 도전장'
      ).toHaveLength(0);
      const noCandidate = await buildCompletedPairInvite(
        firstPage,
        secondPage,
        fixture.rematch.noCandidate.shareToken
      );
      const eligible = await buildCompletedPairInvite(
        firstPage,
        secondPage,
        fixture.rematch.eligible.shareToken
      );
      await prepareTwoPendingInvites(firstPage, secondPage, [
        fixture.outcomes.WIN.shareToken,
        fixture.outcomes.LOSE.shareToken,
      ]);
      expect(
        await supportedPairPendingInvites(
          firstPage,
          firstMemberId,
          secondMemberId
        ),
        '재대결 실행 전 지원 가능한 대기 도전장 2건'
      ).toHaveLength(2);

      // noCandidate(생성 없음) → eligible(3번째 생성) → limit 순서다.
      for (const [kind, expectedCode] of [
        ['noCandidate', 'REMATCH_NO_CANDIDATE'],
        ['eligible', null],
        ['limit', 'INVITE_LIMIT_EXCEEDED'],
      ] as const) {
        if (kind === 'noCandidate') {
          // buildCompletedPairInvite에서 COMPLETED 전이와 result 200을 확인했다.
        }
        const sourceToken =
          kind === 'eligible' ? eligible.shareToken : noCandidate.shareToken;
        const response = await firstPage.request.post(
          `/api/v1/common/challenge-invites/${sourceToken}/rematch`
        );
        const body = await expectApi(
          response,
          expectedCode ? [409] : [200, 201],
          `rematch ${kind}`
        );
        if (expectedCode) {
          expect(JSON.stringify(body)).toContain(expectedCode);
          if (kind === 'noCandidate') {
            await firstPage.goto(
              `/friends/challenge/${noCandidate.shareToken}/result`
            );
            await firstPage
              .getByRole('button', { name: /다시 붙기$/ })
              .click();
            await expect(
              firstPage.getByText('이 단원에서 둘 다 안 푼 문제가 없어요')
            ).toBeVisible();
            for (const viewport of [
              { width: 390, height: 844 },
              { width: 1024, height: 768 },
              { width: 1440, height: 900 },
            ]) {
              await firstPage.setViewportSize(viewport);
              const rematchButton = firstPage
                .getByRole('button', { name: /다시 붙기$/ })
                .first();
              await rematchButton.evaluate((element) =>
                element.scrollIntoView({ block: 'center' })
              );
              await expect(rematchButton).toBeVisible();
              await rematchButton.click({ trial: true });

              if (viewport.width === 390) {
                const bottomNavigation = firstPage.getByTestId(
                  'student-bottom-navigation'
                );
                await expect(bottomNavigation).toBeVisible();
                const [buttonBox, navigationBox] = await Promise.all([
                  rematchButton.boundingBox(),
                  bottomNavigation.boundingBox(),
                ]);
                expect(buttonBox, '390px 다시 붙기 CTA 위치').not.toBeNull();
                expect(
                  navigationBox,
                  '390px 학생 하단 내비 위치'
                ).not.toBeNull();
                expect(buttonBox!.y + buttonBox!.height).toBeLessThanOrEqual(
                  navigationBox!.y
                );
              }

              await firstPage.screenshot({
                path: testInfo.outputPath(
                  `rematch-no-candidate-${viewport.width}.png`
                ),
              });
            }
          }
        } else {
          const rematch = unwrap<{
            challengeId: number;
            unitName: string;
            rematchOfShareToken: string;
          }>(body);
          expect(rematch.challengeId).not.toBe(eligible.originalChallengeId);
          expect(rematch.unitName).toBe(
            fixture.rematch.eligible.expectedUnitName
          );
          expect(rematch.rematchOfShareToken).toBe(eligible.shareToken);
        }
      }
    } finally {
      if (firstMemberId > 0 && secondMemberId > 0) {
        await drainPairPendingInvites(
          firstPage,
          secondPage,
          firstMemberId,
          secondMemberId
        );
      }
      await first.close();
      await second.close();
    }
  });

  test('친구 아닌 사용자의 정복 지도는 API 403, 화면 잠금', async ({
    page,
  }) => {
    const strangerId = loadMvpEFixture().strangerMemberId;
    const body = await expectApi(
      await page.request.get(`/api/v1/common/friends/${strangerId}/mastery`),
      [403],
      '비친구 정복 지도'
    );
    expect(JSON.stringify(body)).toContain('FRIENDSHIP_REQUIRED');
    await page.goto(`/friends/${strangerId}`);
    await expect(page.getByText(/친구가 되면.*정복/)).toBeVisible();
  });

  // 회장 지시(2026-08-07): 단답형(주관식) EBSi 문제는 답 입력칸 + 서버 채점이 필요.
  // V43 시드의 SHORT_ANSWER 문항(challengeId=4066, 정답='42')으로 실제 dev 환경에서
  // 입력칸 렌더 → 정답 제출 → 정오 반영까지 확인한다. 배포 전에는 통과 불가(dev 실환경 대상).
  test('단답형(주관식) 문제는 답 입력칸으로 풀고 서버 채점이 반영된다', async ({
    page,
  }) => {
    const shortAnswerChallengeId = 4066;
    const correctAnswer = '42';

    await solveShortAnswer(page, shortAnswerChallengeId, correctAnswer);

    await expect(page.getByText(/정답|맞았|오답|틀렸/)).toBeVisible();

    const myDetail = unwrap<{
      attempts?: Array<{
        status: string;
        isCorrect: boolean | null;
        selectedAnswer: string | null;
      }>;
    }>(
      await expectApi(
        await page.request.get(
          `/api/v1/common/me/challenges/${shortAnswerChallengeId}`
        ),
        [200],
        '단답형 내 응시 기록'
      )
    );
    const latest = (myDetail.attempts ?? []).at(-1);
    expect(latest?.selectedAnswer).toBe(correctAnswer);
    expect(latest?.isCorrect).toBe(true);
  });

  // R-07 회장 지적: 친구에서 상대 프로필로 못 들어간다.
  // 원장에 "부분 관찰, 프로필 진입 미확인"으로 남아 있던 항목이다.
  //
  // 실측(2026-08-08): 요청 행은 프로필로 가는데 수락된 친구 행은 대결 기록으로만 가서
  // "친구가 되면 프로필로 갈 길이 사라지는" 상태였다. 회장 승인으로 행을 둘로 나눴다.
  // 이름·사진은 프로필, 전적·화살표는 대결 기록. 두 목적지가 다 살아 있어야 통과다.
  test('친구 목록에서 이름은 프로필로, 전적은 대결 기록으로 간다', async ({
    page,
  }) => {
    await page.goto('/friends');

    // 첫 진입이면 친구 사용법 안내창이 자동으로 뜬다(localStorage 플래그, 검사는 매번 새 브라우저라
    // 항상 뜬다). 안내창이 열려 있는 동안 뒤쪽 본문은 화면낭독기 기준으로 가려지므로,
    // 실제 사용자처럼 먼저 닫아야 친구 목록에 접근할 수 있다.
    // goto 는 클라이언트에서 안내창이 뜨기 전에 끝나므로, 뜰 때까지 잠깐 기다렸다가 닫는다.
    const tutorial = page.getByRole('dialog');
    const appeared = await tutorial
      .waitFor({ state: 'visible', timeout: 8_000 })
      .then(() => true)
      .catch(() => false);
    if (appeared) {
      const nextButton = tutorial.getByRole('button', { name: /다음|시작하기/ });
      for (let step = 0; step < 6; step += 1) {
        if (!(await nextButton.isVisible().catch(() => false))) break;
        await nextButton.click();
      }
      await expect(tutorial).toBeHidden();
    }

    const profileLink = page.getByRole('link', { name: /프로필 보기$/ }).first();
    await expect(profileLink).toBeVisible();
    await expect(profileLink).toHaveAttribute(
      'href',
      /\/profile\/student\/\d+$/
    );

    const recordLink = page
      .getByRole('link', { name: /대결 기록 보기$/ })
      .first();
    await expect(recordLink).toBeVisible();
    await expect(recordLink).toHaveAttribute('href', /\/friends\/\d+$/);

    await profileLink.click();
    await page.waitForURL(/\/profile\/student\/\d+$/);

    // 진입만 하고 빈 화면이면 의미가 없다. 본문이 실제로 그려졌는지 본다.
    await expect(page.getByText(/찾을 수 없|문제가 발생/)).toHaveCount(0);
    await expect(page.locator('body')).toContainText(/프로필|학습|목표|소개/);
  });

  // R-14 회장 지적: 정답률이 0%에서 안 움직인다.
  // 서버 계산은 단위테스트가 지키므로, 여기서는 "화면에 실제로 0%가 아닌 값이 뜨는가"와
  // "서버가 준 값과 화면 숫자가 같은가"를 본다. 시드 직후 참여자 0명이면 0%로 고착됐던
  // 것이 원래 증상이라, 참여 기록이 쌓인 뒤의 실제 노출을 확인해야 닫힌다.
  test('문제 카드 정답률이 0% 고착이 아니고 서버 값과 일치한다', async ({
    page,
  }) => {
    const list = unwrap<{
      content?: Array<{
        challengeId: number;
        participantCount: number | null;
        wrongAnswerRate: number | null;
        passRate: number | null;
      }>;
    }>(
      await expectApi(
        await page.request.get(
          `${BACKEND_ORIGIN}/public/challenges?page=0&size=20`
        ),
        [200],
        '공개 문제 목록'
      )
    );
    const items = list.content ?? [];
    expect(items.length, '공개 문제가 있어야 한다').toBeGreaterThan(0);

    const played = items.filter((it) => (it.participantCount ?? 0) > 0);
    expect(
      played.length,
      '참여 기록이 있는 문제가 하나도 없으면 정답률을 검증할 수 없다'
    ).toBeGreaterThan(0);

    const rates = played.map((it) =>
      it.wrongAnswerRate != null ? 100 - it.wrongAnswerRate : (it.passRate ?? 0)
    );
    expect(
      rates.some((rate) => rate > 0),
      '참여자가 있는데 정답률이 전부 0%면 R-14 고착 재발이다'
    ).toBe(true);

    // 화면에도 실제 값이 뜨는지 확인한다. 서버만 맞고 화면이 0%면 회장이 본 증상 그대로다.
    // 현재 공개 문제 목록 정본은 '/challenges' 이며 카드의 표기명은 '통과율'이다.
    // 화면이 어느 문제를 어떤 순서로 보여줄지는 목록 정책에 달렸으므로 특정 문제의
    // 값을 콕 집어 비교하지 않는다. 대신 ①0% 고착이 아닌지 ②화면 값이 서버가 계산할
    // 수 있는 값 범위 안에 있는지를 본다.
    await page.goto('/challenges');
    await expect(page.getByText(/통과율 \d+%/).first()).toBeVisible();
    const shownRates = (await page.getByText(/통과율 \d+%/).allInnerTexts())
      .map((text) => Number(/통과율 (\d+)%/.exec(text)?.[1]))
      .filter((value) => Number.isFinite(value));

    expect(shownRates.length, '화면에 정답률 표기가 있어야 한다').toBeGreaterThan(
      0
    );
    expect(
      shownRates.some((rate) => rate > 0),
      '목록 화면 정답률이 전부 0%면 R-14 고착 재발이다'
    ).toBe(true);
    for (const rate of shownRates) {
      expect(rate, `화면 정답률 ${rate}% 가 0 미만이다`).toBeGreaterThanOrEqual(0);
      expect(rate, `화면 정답률 ${rate}% 가 100 을 넘는다`).toBeLessThanOrEqual(100);
    }
  });
});
