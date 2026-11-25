import {
  ExplanationText,
  SolutionNoteView,
} from '@/features/solution-note/components/solution-note-view';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithQuery } from './helpers';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  put: vi.fn(),
  post: vi.fn(),
  push: vi.fn(),
  getConsent: vi.fn(),
  grant: vi.fn(),
  upload: vi.fn(),
  settle: vi.fn(),
}));

vi.mock('@/entities/handwriting', () => ({
  handwritingRepository: {
    getConsent: mocks.getConsent,
    grantConsent: mocks.grant,
    uploadHandwriting: mocks.upload,
    fetchStrokes: vi.fn(),
  },
  settleDeferredStrokes: mocks.settle,
  flushStrokesOutbox: vi.fn(),
}));

vi.mock('@/shared/api', () => ({
  api: { private: { get: mocks.get, put: mocks.put, post: mocks.post } },
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, back: vi.fn() }),
}));
vi.mock('@/features/open-challenge/hooks/use-open-challenge', () => ({
  useOpenChallengeDetailQuery: () => ({ data: undefined }),
}));

vi.mock('@/shared/components/drawing', () => ({
  SolutionDrawingPad: () => <div data-testid="pad" />,
}));
vi.mock('@/shared/components/drawing/model/drawing-storage', () => ({
  savePageStrokes: vi.fn(),
}));

const DETAIL = {
  solutionNoteId: 3,
  challengeId: 11,
  challengeAttemptId: 21,
  isCorrect: false,
  elapsedSeconds: 120,
  labels: ['SUBMITTED_BEFORE_EXPLANATION'],
  stuckReasons: [],
  explanation: { mode: 'FREE_AFTER_SUBMIT' },
  currentVersionNo: 1,
  versions: [
    {
      versionNo: 1,
      kind: 'SUBMITTED',
      createdAt: '2026-11-23T09:00:00',
      strokeCount: 4,
      pngUrl: null,
      strokesPending: false,
      diffMarks: [{ y0: 0.1, y1: 0.2 }],
    },
  ],
  wrongAnswer: { id: 501, reviewCount: 0, status: 'ACTIVE' },
  submittedAnswer: '3',
  rewardPreview: { fixExp: 20, blankExp: 30 },
};

const EXPLANATION = {
  solutionNoteId: 3,
  steps: [{ no: 1, text: '공차를 구한다', tag: '개념' }],
  cost: { points: 0 },
};

describe('시험 항목 S21 제출 뒤 두 칸 풀이노트', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getConsent.mockResolvedValue({ granted: true });
    mocks.grant.mockResolvedValue(undefined);
    // 해설 열람은 포인트가 나가는 POST 다(교차 리뷰 P1-2). GET 으로는 부르지 않는다.
    mocks.post.mockImplementation((url: string) =>
      url.endsWith('/explanation')
        ? Promise.resolve(EXPLANATION)
        : Promise.reject(new Error(`unmocked post ${url}`))
    );
    mocks.get.mockImplementation((url: string) => {
      if (url === '/student/solution-notes/3') return Promise.resolve(DETAIL);
      if (url === '/student/solution-notes/3/explanation')
        return Promise.resolve(EXPLANATION);
      return Promise.reject(new Error(`unmocked ${url}`));
    });
  });

  it('S21-1 내 풀이와 해설 두 칸을 같은 화면에 보이고 다른 곳 개수를 적는다', async () => {
    renderWithQuery(<SolutionNoteView solutionNoteId={3} />);
    expect(
      await screen.findByRole('region', { name: '내 풀이' })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('region', { name: '해설' })
    ).toBeInTheDocument();
    expect(await screen.findByText(/공차를 구한다/)).toBeInTheDocument();
    expect(screen.getByTestId('diff-count')).toHaveTextContent('다른 곳 1');
  });

  it('S21-2 막힌 이유 칩을 누르면 stuck-reasons 전체 교체 PUT 을 부른다', async () => {
    const user = userEvent.setup();
    mocks.put.mockResolvedValue({
      reasons: ['TOOK_LONG'],
      suggestImport: false,
    });
    renderWithQuery(<SolutionNoteView solutionNoteId={3} />);
    const chips = await screen.findAllByTestId('stuck-chip');
    await user.click(chips[0]!);
    await waitFor(() => expect(mocks.put).toHaveBeenCalled());
    expect(mocks.put.mock.calls[0]![0]).toBe(
      '/student/solution-notes/3/stuck-reasons'
    );
    expect(mocks.put.mock.calls[0]![1]).toEqual({ reasons: ['TOOK_LONG'] });
  });

  it('S21-9 해설은 POST 로 열람하고 GET 으로는 부르지 않는다 (교차 리뷰 P1-2)', async () => {
    renderWithQuery(<SolutionNoteView solutionNoteId={3} />);
    expect(await screen.findByText(/공차를 구한다/)).toBeInTheDocument();
    expect(mocks.post).toHaveBeenCalledWith(
      '/student/solution-notes/3/explanation'
    );
    expect(
      mocks.get.mock.calls.some((c) => String(c[0]).endsWith('/explanation'))
    ).toBe(false);
  });

  it('S21-6 제출 답 칩과 두 버튼의 예고 EXP 를 서버 값으로 보인다', async () => {
    renderWithQuery(<SolutionNoteView solutionNoteId={3} />);
    expect(await screen.findByTestId('note-submitted-chip')).toHaveTextContent(
      '제출 답 ③'
    );
    expect(screen.getByTestId('note-to-blank')).toHaveTextContent('+30 EXP');
  });

  it('S21-7 거절: 예고 EXP 가 0 이면 버튼에 EXP 를 적지 않는다', async () => {
    mocks.get.mockImplementation((url: string) => {
      if (url === '/student/solution-notes/3')
        return Promise.resolve({
          ...DETAIL,
          rewardPreview: { fixExp: 0, blankExp: 0 },
        });
      if (url === '/student/solution-notes/3/explanation')
        return Promise.resolve(EXPLANATION);
      return Promise.reject(new Error(`unmocked ${url}`));
    });
    renderWithQuery(<SolutionNoteView solutionNoteId={3} />);
    expect(await screen.findByTestId('note-to-blank')).not.toHaveTextContent(
      'EXP'
    );
  });

  it('S21-3 틀린 문제에서 백지에 다시 풀기를 누르면 백지 화면으로 이동한다', async () => {
    const user = userEvent.setup();
    renderWithQuery(<SolutionNoteView solutionNoteId={3} />);
    await user.click(await screen.findByTestId('note-to-blank'));
    expect(mocks.push).toHaveBeenCalledWith(
      '/dashboard/student/review/blank/501'
    );
  });

  it('S21-4 고치기를 누르면 그림판이 열리고 저장 버튼으로 바뀐다', async () => {
    const user = userEvent.setup();
    mocks.get.mockImplementation((url: string) => {
      if (url === '/student/solution-notes/3') return Promise.resolve(DETAIL);
      if (url === '/student/solution-notes/3/explanation')
        return Promise.resolve(EXPLANATION);
      if (url.endsWith('/versions/1'))
        return Promise.resolve({
          versionNo: 1,
          kind: 'SUBMITTED',
          pngUrl: null,
          strokesUrl: null,
          diffMarks: [],
        });
      return Promise.reject(new Error(`unmocked ${url}`));
    });
    renderWithQuery(<SolutionNoteView solutionNoteId={3} />);
    await user.click(await screen.findByTestId('note-start-fix'));
    expect(await screen.findByTestId('note-save-fix')).toBeInTheDocument();
    expect(screen.getByTestId('pad')).toBeInTheDocument();
  });

  const openFixing = async () => {
    const user = userEvent.setup();
    mocks.get.mockImplementation((url: string) => {
      if (url === '/student/solution-notes/3') return Promise.resolve(DETAIL);
      if (url === '/student/solution-notes/3/explanation')
        return Promise.resolve(EXPLANATION);
      if (url.endsWith('/versions/1'))
        return Promise.resolve({
          versionNo: 1,
          kind: 'SUBMITTED',
          pngUrl: null,
          strokesUrl: null,
          diffMarks: [],
        });
      return Promise.reject(new Error(`unmocked ${url}`));
    });
    renderWithQuery(<SolutionNoteView solutionNoteId={3} />);
    await user.click(await screen.findByTestId('note-start-fix'));
    await screen.findByTestId('note-save-fix');
    return user;
  };
  const revisions = () =>
    mocks.post.mock.calls.filter((c) => String(c[0]).endsWith('/revisions'));

  const PNG_ONLY_REF = {
    pngMediaId: 1,
    strokesMediaId: null,
    strokesDeferred: false,
    strokeCount: 0,
    strokeBytes: 0,
    strokesSha256: null,
    pngSha256: 'b'.repeat(64),
    schemaVersion: 1,
    layoutWidth: 1024,
    layoutHeight: 1400,
  };
  const REVISED = {
    versionNo: 2,
    changed: true,
    handwriting: { assetId: 1, strokesPending: false },
    reward: { granted: false, reason: 'ALREADY_REWARDED_TODAY' },
  };

  it('S21-8 거절: 동의가 없고 나중에 를 누르면 획 좌표 없이 PNG 한 장으로 고친 풀이를 저장한다 (2회차 P1-5)', async () => {
    mocks.getConsent.mockResolvedValue({ granted: false });
    mocks.upload.mockResolvedValue(PNG_ONLY_REF);
    mocks.post.mockImplementation((url: string) =>
      url.endsWith('/explanation')
        ? Promise.resolve(EXPLANATION)
        : Promise.resolve(REVISED)
    );
    const user = await openFixing();
    await user.click(screen.getByTestId('note-save-fix'));
    await user.click(await screen.findByTestId('consent-decline'));
    await waitFor(() => expect(revisions()).toHaveLength(1));
    expect(mocks.upload).toHaveBeenCalledWith(
      expect.objectContaining({ pngOnly: true })
    );
    const body = revisions()[0]![1] as {
      handwriting: { strokesMediaId: number | null };
    };
    expect(body.handwriting.strokesMediaId).toBeNull();
    // 획을 올리지 않았으니 보관함 재첨부도 하지 않는다.
    expect(mocks.settle).not.toHaveBeenCalled();
  });

  it('S21-8b 동의가 있으면 획까지 올린다(pngOnly 가 아니다)', async () => {
    mocks.upload.mockResolvedValue({
      ...PNG_ONLY_REF,
      strokesMediaId: 2,
      strokeCount: 3,
      strokeBytes: 100,
      strokesSha256: 'a'.repeat(64),
    });
    mocks.post.mockImplementation((url: string) =>
      url.endsWith('/explanation')
        ? Promise.resolve(EXPLANATION)
        : Promise.resolve(REVISED)
    );
    const user = await openFixing();
    await user.click(screen.getByTestId('note-save-fix'));
    await waitFor(() => expect(revisions()).toHaveLength(1));
    expect(mocks.upload).toHaveBeenCalledWith(
      expect.objectContaining({ pngOnly: false })
    );
    await waitFor(() => expect(mocks.settle).toHaveBeenCalledTimes(1));
  });

  it('S21-8c 서버가 동의문 버전 변경(CONSENT_REQUIRED)을 주고 다시 거절하면 획 없는 PNG 로 다시 올려 보낸다', async () => {
    mocks.upload
      .mockResolvedValueOnce({
        ...PNG_ONLY_REF,
        strokesMediaId: 2,
        strokeCount: 3,
        strokeBytes: 100,
        strokesSha256: 'a'.repeat(64),
      })
      .mockResolvedValueOnce(PNG_ONLY_REF);
    let revisionCalls = 0;
    mocks.post.mockImplementation((url: string) => {
      if (url.endsWith('/explanation')) return Promise.resolve(EXPLANATION);
      revisionCalls += 1;
      if (revisionCalls === 1) {
        return Promise.reject(
          new AxiosError('x', '400', undefined, undefined, {
            status: 400,
            data: {
              code: 'CONSENT_REQUIRED',
              message: '동의 필요',
              data: { consentType: 'HANDWRITING_STORE' },
            },
            statusText: '',
            headers: {},
            config: {} as never,
          })
        );
      }
      return Promise.resolve(REVISED);
    });
    const user = await openFixing();
    await user.click(screen.getByTestId('note-save-fix'));
    // 처음엔 동의가 있어 획까지 올린다. 서버가 버전 변경을 알려 다시 물으면 거절한다.
    mocks.getConsent.mockResolvedValue({ granted: false });
    await user.click(await screen.findByTestId('consent-decline'));
    await waitFor(() => expect(revisions()).toHaveLength(2));
    expect(mocks.upload).toHaveBeenCalledTimes(2);
    expect(mocks.upload).toHaveBeenLastCalledWith(
      expect.objectContaining({ pngOnly: true })
    );
    const second = revisions()[1]![1] as {
      handwriting: { strokesMediaId: number | null };
    };
    expect(second.handwriting.strokesMediaId).toBeNull();
    expect(mocks.settle).not.toHaveBeenCalled();
  });

  it('S21-9 거절: 업로드가 끝나기 전 저장을 연달아 눌러도 저장 요청은 한 번만 나간다', async () => {
    let release: (value: unknown) => void = () => {};
    mocks.upload.mockImplementation(
      () => new Promise((resolve) => (release = resolve))
    );
    mocks.post.mockImplementation((url: string) =>
      url.endsWith('/explanation')
        ? Promise.resolve(EXPLANATION)
        : Promise.resolve({
            versionNo: 2,
            reward: { granted: false, reason: 'ALREADY_REWARDED_TODAY' },
          })
    );
    const user = await openFixing();
    await user.dblClick(screen.getByTestId('note-save-fix'));
    await waitFor(() => expect(mocks.upload).toHaveBeenCalledTimes(1));
    release({
      pngMediaId: 1,
      strokesMediaId: 2,
      strokesDeferred: false,
      strokeCount: 3,
      strokeBytes: 100,
      strokesSha256: 'a'.repeat(64),
      pngSha256: 'b'.repeat(64),
      schemaVersion: 1,
      layoutWidth: 1024,
      layoutHeight: 1400,
    });
    await waitFor(() => expect(revisions()).toHaveLength(1));
    expect(mocks.upload).toHaveBeenCalledTimes(1);
  });

  it('S21-5 풀이노트를 못 찾으면 오류 상태를 보이고 다시 시도 버튼이 있다', async () => {
    mocks.get.mockRejectedValue(new Error('404'));
    renderWithQuery(<SolutionNoteView solutionNoteId={3} />);
    expect(
      await screen.findByText('풀이노트를 찾을 수 없어요')
    ).toBeInTheDocument();
  });
});

describe('해설 원문 그림 (스모크에서 발견)', () => {
  it('S12-9 마크다운 이미지는 글자 그대로가 아니라 그림으로 그린다', () => {
    renderWithQuery(
      <ExplanationText text={'먼저 보자\n![해설](/mock/4004.png)'} />
    );
    const img = screen.getByAltText('해설');
    expect(img).toHaveAttribute('src', '/mock/4004.png');
    expect(screen.queryByText(/!\[해설\]/)).not.toBeInTheDocument();
  });

  it('S12-11 거절: http(s)·사이트 경로가 아닌 그림 주소(javascript, data)는 그리지 않고 글자로 둔다', () => {
    const { container } = renderWithQuery(
      <ExplanationText
        text={'![x](javascript:alert(1)) ![y](data:text/html;base64,AAA)'}
      />
    );
    expect(container.querySelectorAll('img')).toHaveLength(0);
  });

  it('S12-10 거절: 그림이 없는 글은 그대로 글로만 나온다', () => {
    renderWithQuery(<ExplanationText text="그냥 글" />);
    expect(screen.getByText('그냥 글')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
