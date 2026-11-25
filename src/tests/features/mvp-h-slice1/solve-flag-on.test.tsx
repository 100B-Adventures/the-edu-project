import { ChallengeSolveClient } from '@/features/open-challenge/components/solve/challenge-solve-client';
import { useOpenChallengeDetailQuery } from '@/features/open-challenge/hooks/use-open-challenge';
import { renderWithProviders } from '@/tests/utils';
import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({
  startAttemptAsync: vi.fn(),
  submitAnswerAsync: vi.fn(),
  createReviewAsync: vi.fn(),
  uploadDrawingAsync: vi.fn(),
  submitNote: vi.fn(),
  push: vi.fn(),
  toast: vi.fn(),
}));

vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: () => ({ push: m.push, replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/features/open-challenge/hooks/use-open-challenge', () => ({
  useOpenChallengeDetailQuery: vi.fn(),
  useCoachOpeningQuery: vi.fn(() => ({ data: undefined })),
  useMyOpenChallengeDetailQuery: vi.fn(() => ({ data: undefined })),
  useStartChallengeAttemptMutation: vi.fn(() => ({
    mutateAsync: m.startAttemptAsync,
    isPending: false,
  })),
  useSubmitChallengeAnswerMutation: vi.fn(() => ({
    mutateAsync: m.submitAnswerAsync,
    isPending: false,
  })),
  useGuestGradeChallengeMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useCreateChallengeReviewMutation: vi.fn(() => ({
    mutateAsync: m.createReviewAsync,
  })),
  useFinishAiCoachingSessionMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));
vi.mock('@/features/social/hooks', () => ({
  usePublicInvitePreviewQuery: vi.fn(() => ({ data: undefined })),
  useClaimGuestSessionMutation: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));
vi.mock('@/features/social', () => ({ ChallengeShareButton: () => null }));
vi.mock('@/shared/components/drawing', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/shared/components/drawing')>();
  return {
    ...actual,
    useDrawingUpload: vi.fn(() => ({
      uploadDrawingAsync: m.uploadDrawingAsync,
      isUploading: false,
    })),
    exportStrokesToDataURL: vi.fn(() => 'data:image/png;base64,test'),
    SolutionDrawingPad: ({
      onStrokesChange,
    }: {
      onStrokesChange?: (strokes: unknown[]) => void;
    }) => (
      <button
        type="button"
        data-testid="mock-draw-stroke"
        onClick={() =>
          onStrokesChange?.([
            {
              id: 's1',
              pageNumber: 1,
              points: [
                { x: 0.1, y: 0.1 },
                { x: 0.2, y: 0.2 },
              ],
              color: '#111111',
              size: 3,
              tool: 'pen',
            },
          ])
        }
      >
        획
      </button>
    ),
  };
});
vi.mock('@/shared/lib/analytics', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/lib/analytics')>()),
  trackOcStart: vi.fn(),
  trackOcSubmit: vi.fn(),
}));
vi.mock('@/features/open-challenge/components/solve/ai-coach-panel', () => ({
  AiCoachPanel: () => null,
}));
vi.mock(
  '@/features/solution-note/submit-solution-note',
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import('@/features/solution-note/submit-solution-note')
    >()),
    submitSolutionNote: m.submitNote,
  })
);
vi.mock('@/shared/components/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/components/ui')>()),
  showBottomToast: m.toast,
}));

const challenge = {
  id: 4167,
  subject: '수학',
  topic: '이차방정식',
  questionText: '문제',
  questionImageUrl: null,
  choices: ['1', '2', '3', '4'],
};

const submit = async () => {
  const user = userEvent.setup();
  renderWithProviders(
    <ChallengeSolveClient
      challengeId="4167"
      isLoggedIn
    />
  );
  await user.click(screen.getAllByTestId('choice-option-0')[0]!);
  await user.click(screen.getByTestId('mock-draw-stroke'));
  return user;
};

describe('시험 항목 S25 플래그 켜짐 제출 흐름(풀이노트)', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_MVPH_SLICE1', 'on');
    Object.values(m).forEach((fn) => fn.mockReset());
    vi.mocked(useOpenChallengeDetailQuery).mockReturnValue({
      data: challenge,
      isLoading: false,
      isError: false,
    } as never);
    m.startAttemptAsync.mockResolvedValue({ attemptId: 21 });
    m.submitAnswerAsync.mockResolvedValue({ isCorrect: false });
    window.sessionStorage.clear();
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  test('S25-1 풀이노트 생성이 도는 동안 제출을 연달아 눌러도 채점·생성은 한 번만 보낸다', async () => {
    let finish: (result: {
      solutionNoteId: number;
      strokesSaved: boolean;
    }) => void = () => {};
    m.submitNote.mockImplementation(
      () =>
        new Promise<{ solutionNoteId: number; strokesSaved: boolean }>(
          (resolve) => (finish = resolve)
        )
    );
    const user = await submit();
    const button = screen.getByTestId('challenge-submit-button');
    await user.dblClick(button);
    await waitFor(() => expect(m.submitNote).toHaveBeenCalledTimes(1));
    await user.click(button);
    m.uploadDrawingAsync.mockResolvedValue({ mediaAssetId: 3 });
    m.createReviewAsync.mockResolvedValue({});
    finish({ solutionNoteId: 77, strokesSaved: true });
    await waitFor(() =>
      expect(m.push).toHaveBeenCalledWith(
        '/dashboard/student/solution-notes/77'
      )
    );
    expect(m.submitAnswerAsync).toHaveBeenCalledTimes(1);
    expect(m.submitNote).toHaveBeenCalledTimes(1);
  });

  test('S25-2 동의를 안 해 PNG 만 저장했어도 풀이노트로 가고, 손글씨는 공유로 올리지 않는다 (교차 리뷰 P1-8)', async () => {
    m.submitNote.mockResolvedValue({ solutionNoteId: 78, strokesSaved: false });
    await submit();
    await userEvent
      .setup()
      .click(screen.getByTestId('challenge-submit-button'));
    await waitFor(() =>
      expect(m.push).toHaveBeenCalledWith(
        '/dashboard/student/solution-notes/78'
      )
    );
    expect(m.uploadDrawingAsync).not.toHaveBeenCalled();
    expect(m.createReviewAsync).not.toHaveBeenCalled();
  });

  test('S25-4 풀이노트가 만들어지면 D-14 손글씨 공유를 먼저 하고 그 뒤에 이동한다 (교차 리뷰 P1-12, 성공 경로)', async () => {
    const order: string[] = [];
    m.submitNote.mockResolvedValue({ solutionNoteId: 79, strokesSaved: true });
    m.uploadDrawingAsync.mockImplementation(async () => {
      order.push('upload');
      return { mediaAssetId: 3 };
    });
    m.createReviewAsync.mockImplementation(async () => {
      order.push('review');
      return {};
    });
    m.push.mockImplementation(() => order.push('push'));
    await submit();
    await userEvent
      .setup()
      .click(screen.getByTestId('challenge-submit-button'));
    await waitFor(() => expect(order).toEqual(['upload', 'review', 'push']));
    expect(m.createReviewAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        solutionType: 'DRAWING',
        drawingImageMediaId: 3,
      })
    );
  });

  test('S25-5 공유가 실패해도 풀이노트로 이동하고 실패를 알린다 (교차 리뷰 P1-12, 실패 경로)', async () => {
    m.submitNote.mockResolvedValue({ solutionNoteId: 80, strokesSaved: true });
    m.uploadDrawingAsync.mockRejectedValue(new Error('net'));
    await submit();
    await userEvent
      .setup()
      .click(screen.getByTestId('challenge-submit-button'));
    await waitFor(() =>
      expect(m.push).toHaveBeenCalledWith(
        '/dashboard/student/solution-notes/80'
      )
    );
    expect(m.toast).toHaveBeenCalledWith(
      '풀이노트는 만들었지만 손글씨 공유는 올리지 못했어요.'
    );
    expect(m.createReviewAsync).not.toHaveBeenCalled();
  });

  test('S25-3 풀이노트 생성이 실패하면 알리고 기존 결과 화면 흐름(공유 포함)으로 이어 간다', async () => {
    m.submitNote.mockRejectedValue(new Error('500'));
    m.uploadDrawingAsync.mockResolvedValue({ mediaAssetId: 3 });
    m.createReviewAsync.mockResolvedValue({});
    await submit();
    await userEvent
      .setup()
      .click(screen.getByTestId('challenge-submit-button'));
    await waitFor(() =>
      expect(m.toast).toHaveBeenCalledWith(
        '풀이노트를 만들지 못했어요. 결과 화면으로 이동해요.'
      )
    );
    await waitFor(() => expect(m.uploadDrawingAsync).toHaveBeenCalled());
  });
});
