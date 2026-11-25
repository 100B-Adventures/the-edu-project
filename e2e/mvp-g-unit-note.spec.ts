import type {
  UnitNoteDetail,
  UnitNoteLibrary,
  UnitNoteNode,
} from '@/entities/unit-note';
import { type Page, expect, test } from '@playwright/test';

import { okBody } from './helpers/api-mock';
import { mockMemberInfo, setAuthCookie } from './helpers/auth-mock';

const STUDENT_MEMBER = {
  id: 7,
  email: 'mvp-g-student@test.com',
  name: 'MVP-G 학생',
  role: 'ROLE_STUDENT',
};

const nodes: UnitNoteNode[] = [
  {
    nodeId: 10,
    parentId: null,
    subject: 'MATH_1',
    unit: 'sequence',
    displayName: '수열',
    depth: 0,
    pageCount: 0,
    penPageCount: 0,
    uploadPageCount: 0,
    teachingNoteCount: 0,
    relatedProblemCount: 0,
    masteryScore: 0,
    hintFreeSolveCount: 0,
    leafLevel: 'DEEP',
    coverPage: null,
    lastPageAt: null,
  },
  ...[
    ['arithmetic_sequence', '등차수열', 11, 1],
    ['geometric_sequence', '등비수열', 12, 2],
    ['sum_of_sequences', '수열의 합', 13, 0],
    ['mathematical_induction', '수학적 귀납법', 14, 3],
  ].map(
    ([unit, displayName, nodeId, pageCount]): UnitNoteNode => ({
      nodeId: Number(nodeId),
      parentId: 10,
      subject: 'MATH_1',
      unit: String(unit),
      displayName: String(displayName),
      depth: 1,
      pageCount: Number(pageCount),
      penPageCount: nodeId === 14 ? 1 : 0,
      uploadPageCount: Number(pageCount) - (nodeId === 14 ? 1 : 0),
      teachingNoteCount: nodeId === 14 ? 2 : 0,
      relatedProblemCount: nodeId === 14 ? 2 : 0,
      masteryScore: nodeId === 14 ? 30 : 0,
      hintFreeSolveCount: nodeId === 14 ? 1 : 0,
      leafLevel:
        Number(pageCount) === 0 ? 'GRAY' : nodeId === 14 ? 'DEEP' : 'LIT',
      lastPageAt: null,
      coverPage:
        Number(pageCount) === 0
          ? null
          : {
              pageId: Number(nodeId) * 10,
              source: nodeId === 14 ? 'PEN' : 'UPLOAD',
              fileName: `${String(displayName)}-표지.png`,
              mimeType: 'image/png',
              viewUrl: null,
            },
    })
  ),
];

const detail: UnitNoteDetail = {
  nodeId: 14,
  pages: [
    {
      pageId: 140,
      position: 1,
      source: 'PEN',
      fileName: '수학적귀납법-내노트-1.png',
      mimeType: 'image/png',
      sizeBytes: 245760,
      viewUrl: null,
      cover: true,
      hiddenByStudent: false,
      teacherId: null,
      teacherMemo: null,
      createdAt: '2026-07-21T09:00:00',
    },
    {
      pageId: 141,
      position: 2,
      source: 'UPLOAD',
      fileName: '굿노트-수학적귀납법-2.png',
      mimeType: 'image/png',
      sizeBytes: 1925120,
      viewUrl: null,
      cover: false,
      hiddenByStudent: false,
      teacherId: null,
      teacherMemo: null,
      createdAt: '2026-07-26T09:00:00',
    },
    {
      pageId: 142,
      position: 3,
      source: 'UPLOAD',
      fileName: '굿노트-수학적귀납법-3.png',
      mimeType: 'image/png',
      sizeBytes: 2048000,
      viewUrl: null,
      cover: false,
      hiddenByStudent: false,
      teacherId: null,
      teacherMemo: null,
      createdAt: '2026-07-29T09:00:00',
    },
  ],
  teachingLayers: [
    {
      teachingNoteId: 501,
      title: '수학적 귀납법 판서 1',
      summary: '점화식은 유형부터 판정합니다.',
      taughtAt: '2026-07-17T10:00:00',
    },
    {
      teachingNoteId: 502,
      title: '수학적 귀납법 판서 2',
      summary: '귀납 가정과 결론을 분리합니다.',
      taughtAt: '2026-07-24T10:00:00',
    },
  ],
  relatedProblems: [
    {
      wrongAnswerId: 701,
      title: '6월 모평 28번 · 점화식',
      questionText: '점화식에서 일반항을 추론하세요.',
      sourceText: '6월 모평',
      reviewCount: 2,
      status: 'ACTIVE',
      nextReviewAt: '2026-08-03T09:00:00',
    },
    {
      wrongAnswerId: 702,
      title: '수학적 귀납법 조건 확인',
      questionText: '귀납 가정과 결론을 구분하세요.',
      sourceText: '정성T 수업',
      reviewCount: 1,
      status: 'ACTIVE',
      nextReviewAt: '2026-08-01T09:00:00',
    },
  ],
};

const library = (withDetail: boolean): UnitNoteLibrary => ({
  totalPages: 6,
  nodes,
  detail: withDetail ? detail : null,
});

const setupUnitNoteApi = async (page: Page) => {
  await setAuthCookie(page);
  await page.route('**/api/v1/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: okBody({}),
    });
  });
  await mockMemberInfo(page, STUDENT_MEMBER);
  await page.route('**/api/v1/student/unit-notes**', async (route) => {
    const request = route.request();
    if (request.method() === 'POST') {
      expect(request.postDataJSON()).toEqual({
        pages: [{ source: 'UPLOAD', mediaId: 'unit-note-e2e', cover: false }],
      });
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: okBody(library(request.url().includes('nodeId='))),
    });
  });
};

test.describe('MVP-G 단권화', () => {
  test('전체 트리에서 수열 방을 열고 개념 지층을 본다', async ({ page }) => {
    await setupUnitNoteApi(page);

    await page.goto('/dashboard/student/unit-notes');
    const openRoom = page.getByRole('link', { name: '이어서 정리하기' });
    await expect(openRoom).toHaveAttribute(
      'href',
      '/dashboard/student/unit-notes/10'
    );
    await openRoom.click();

    await expect(page).toHaveURL(/\/dashboard\/student\/unit-notes\/10$/);
    await expect(
      page.getByRole('heading', { name: '수열', exact: true })
    ).toBeVisible();
    await expect(page.getByTestId('unit-note-concept-row-14')).toContainText(
      '수학적 귀납법'
    );
    await page.getByTestId('unit-note-open-pen').click();
    await expect(page.getByText('수학적 귀납법 판서 1')).toBeVisible();
    await expect(page.getByText('6월 모평 28번 · 점화식')).toBeVisible();
    await expect(page.getByTestId('unit-note-page-grid')).toBeVisible();
  });

  test('이미지 한 장을 업로드해 현재 소단원 끝에 append한다', async ({
    page,
  }) => {
    await setupUnitNoteApi(page);
    await page.route('**/api/v1/common/media/presign-batch', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: okBody({
          mediaAssetList: [
            {
              fileName: '귀납법-추가.png',
              mediaId: 'unit-note-e2e',
              uploadUrl: 'https://upload.example.test/unit-note-e2e',
              headers: { 'Content-Type': 'image/png' },
            },
          ],
        }),
      });
    });
    await page.route('https://upload.example.test/**', async (route) => {
      await route.fulfill({ status: 200, body: '' });
    });

    await page.goto('/dashboard/student/unit-notes/10');
    await page.getByTestId('unit-note-open-upload').click();
    await page.getByTestId('unit-note-file-input').setInputFiles({
      name: '귀납법-추가.png',
      mimeType: 'image/png',
      buffer: Buffer.from('unit-note-e2e'),
    });

    await expect(page.getByText('책장에 꽂힘')).toBeVisible();
  });
});
