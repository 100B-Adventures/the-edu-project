'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

import { ChallengeShareButton } from '@/features/social';
import {
  useClaimGuestSessionMutation,
  usePublicInvitePreviewQuery,
} from '@/features/social/hooks';
import { SolutionDrawingPad, type Stroke } from '@/shared/components/drawing';
import { BackButton, Button, Dialog, Prompt } from '@/shared/components/ui';
import { PUBLIC } from '@/shared/constants';
import { cn } from '@/shared/lib';
import { trackOcStart, trackOcSubmit } from '@/shared/lib/analytics';
import {
  Bot,
  ChevronDown,
  ChevronUp,
  ChevronsLeftRight,
  Maximize2,
  Minimize2,
  Pencil,
  X,
} from 'lucide-react';

import {
  useCoachOpeningQuery,
  useFinishAiCoachingSessionMutation,
  useGuestGradeChallengeMutation,
  useMyOpenChallengeDetailQuery,
  useOpenChallengeDetailQuery,
  useStartChallengeAttemptMutation,
  useSubmitChallengeAnswerMutation,
} from '../../hooks/use-open-challenge';
import { SignupSheet } from '../guest/signup-sheet';
import { AiCoachPanel } from './ai-coach-panel';
import { ChallengeHistoryDialog } from './challenge-history-dialog';
import { ChallengeSolveSkeleton } from './challenge-solve-skeleton';
import { ChoiceList } from './choice-list';
import { persistSolveResult } from './persist-result';
import { ShortAnswerInput } from './short-answer-input';
import { useDrawingShare } from './use-drawing-share';
import { useSolutionNoteHandoff } from './use-solution-note-handoff';

type ChallengeSolveClientProps = {
  challengeId: string;
  isLoggedIn: boolean;
};

// FDD F-14: 도전장 링크당 한 문제를 가입 없이 풀 수 있다.
const GUEST_FREE_LIMIT = 1;
const GUEST_SOLVED_COUNT_KEY = 'oc-guest-solved-count';

// 집중 모드: 손풀이 칸 높이. 기본은 현행 440(SolutionDrawingPad 기본값)을 유지하고,
// 집중 모드를 켜면 크게 키운다. 시안 v2가 정한 웹 400 / 태블릿 600 목표를 하나의 값으로
// 근사한다(반응형 height prop을 새로 만들지 않고 기존 기본값보다 확실히 커지는 선을 택함).
const DRAWING_PAD_HEIGHT_DEFAULT = 440;
const DRAWING_PAD_HEIGHT_FOCUS = 640;

// 문제 카드는 문제와 답 고르기를 붙여 sticky로 고정한다(회장 결정). 문항 본문이 아주 길면
// 카드가 화면을 다 먹어 손풀이 칸을 누를 수 있으므로, 문제 본문 스크롤 영역에 상한을 둔다.
// 근거: tasks/mvp-e-solve-spec-v2-2026-08-18.output 자가심문 항목(WEAKEST_LINE) — build 전
// 정해야 한다고 명시된 값. 뷰포트의 38%로 캡을 두면 배지·답 고르기·제출 바가 항상 보이는
// 여유가 남는다(문제 카드 자체 sticky 높이 상한이 아니라, 그 안 "문제 본문"만 스크롤시켜
// 카드 전체 높이를 제어하는 방식 — 답 고르기가 카드 밖으로 밀려나지 않게 하기 위함).
const QUESTION_BODY_MAX_HEIGHT = '38vh';

// AI 코치 패널 폭 — 고정 380px 대신 드래그 리사이즈 + 좁게/넓게 2단 토글을 함께 제공한다.
const AI_PANEL_WIDTH_KEY = 'oc-ai-panel-width';
const AI_PANEL_MIN_WIDTH = 300;
const AI_PANEL_MAX_WIDTH = 640;
const AI_PANEL_NARROW_WIDTH = 380;
const AI_PANEL_WIDE_WIDTH = 520;

const readAiPanelWidth = (): number => {
  if (typeof window === 'undefined') return AI_PANEL_NARROW_WIDTH;
  const raw = window.localStorage.getItem(AI_PANEL_WIDTH_KEY);
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isFinite(parsed)) return AI_PANEL_NARROW_WIDTH;
  return Math.min(Math.max(parsed, AI_PANEL_MIN_WIDTH), AI_PANEL_MAX_WIDTH);
};

const readGuestSolvedCount = (): number => {
  if (typeof window === 'undefined') return 0;
  const raw = window.localStorage.getItem(GUEST_SOLVED_COUNT_KEY);
  const parsed = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const bumpGuestSolvedCount = (): number => {
  const next = readGuestSolvedCount() + 1;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(GUEST_SOLVED_COUNT_KEY, String(next));
  }
  return next;
};

export const ChallengeSolveClient = ({
  challengeId,
  isLoggedIn,
}: ChallengeSolveClientProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('inviteToken') ?? '';
  const hasGuestSession = searchParams.get('guestSession') === '1';
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  // 풀이는 손글씨 전용 — 펜으로만 기록하며, 미입력 제출도 허용한다(보조 기록).
  const [drawingStrokes, setDrawingStrokes] = useState<Stroke[]>([]);
  const [isQuestionOpen, setIsQuestionOpen] = useState(true);
  const [isInviteContextOpen, setIsInviteContextOpen] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const { handoff, consentDialog } = useSolutionNoteHandoff();
  // 제출 전체(채점, 동의, 손필기 업로드, 풀이노트 생성)가 끝날 때까지 두 번째 제출을 막는다.
  const submittingRef = useRef(false);
  const [isNoteSubmitting, setIsNoteSubmitting] = useState(false);
  const [isEmptyDrawingPromptOpen, setIsEmptyDrawingPromptOpen] =
    useState(false);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [isMobileAiOpen, setIsMobileAiOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [aiAttemptId, setAiAttemptId] = useState<string | null>(null);
  const [aiSessionId, setAiSessionId] = useState<string | null>(null);
  const aiAttemptIdRef = useRef<string | null>(null);
  const startAttemptPromiseRef = useRef<Promise<string> | null>(null);
  // 게스트 무료 풀이(클라 채점 맛보기) 상태
  const [guestGradeResult, setGuestGradeResult] = useState<boolean | null>(
    null
  );
  const [aiPanelWidth, setAiPanelWidth] = useState(AI_PANEL_NARROW_WIDTH);
  const isDraggingAiPanelRef = useRef(false);
  const [isSignupSheetOpen, setIsSignupSheetOpen] = useState(false);
  const [signupTrigger, setSignupTrigger] = useState<
    'limit-reached' | 'correct-answer'
  >('correct-answer');
  // 집중 모드(회장 결정) — 켜면 전역 사이드바·코치 칸을 접어 손풀이 칸을 넓힌다.
  // 자동으로 켜지지 않는다. 켜는 주체는 항상 학생이다(시안 v2 §4 규칙 1).
  const [isFocusMode, setIsFocusMode] = useState(false);
  // 집중 모드에서 접힌 코치를 다시 부르면 레일 옆에 겹쳐 연다(레이아웃은 그대로 두고
  // 코치만 얹는다). 웹/태블릿 전용 — 모바일은 원래 코치가 별도 모달이라 대상이 아니다.
  const [isFocusCoachOpen, setIsFocusCoachOpen] = useState(false);
  const choiceSectionRef = useRef<HTMLDivElement>(null);
  const hasClaimedGuestRef = useRef(false);
  // 계측 보조 refs (D2)
  const mountTimeRef = useRef(Date.now());
  const hasFiredStartRef = useRef(false);
  const solutionViewedRef = useRef(false);
  const messageCountRef = useRef(0);

  const {
    data: challenge,
    isLoading: isChallengeLoading,
    isError: isChallengeError,
  } = useOpenChallengeDetailQuery(challengeId);
  const { data: coachOpening } = useCoachOpeningQuery(challengeId);
  const { data: invitePreview } = usePublicInvitePreviewQuery(inviteToken, {
    enabled: inviteToken.length > 0,
  });
  const { data: challengeHistory } = useMyOpenChallengeDetailQuery(
    challengeId,
    { enabled: isLoggedIn }
  );
  const startAttemptMutation = useStartChallengeAttemptMutation();
  const submitAnswerMutation = useSubmitChallengeAnswerMutation(challengeId);
  const guestGradeMutation = useGuestGradeChallengeMutation(challengeId);
  const claimGuestSessionMutation = useClaimGuestSessionMutation();
  const finishAiCoachingSessionMutation = useFinishAiCoachingSessionMutation();
  const { shareDrawing, isUploading } = useDrawingShare();
  const isSubmitting =
    startAttemptMutation.isPending ||
    submitAnswerMutation.isPending ||
    guestGradeMutation.isPending ||
    finishAiCoachingSessionMutation.isPending ||
    isNoteSubmitting ||
    isUploading;
  const hasChallengeHistory =
    !!challengeHistory &&
    (challengeHistory.attempts.length > 0 ||
      challengeHistory.reviews.length > 0);
  const isInviteResultUnlocked =
    invitePreview?.opponentSolvedAt != null &&
    (challengeHistory?.attempts.some(
      (attempt) => attempt.status === 'COMPLETED'
    ) ??
      false);

  const ensureAttempt = useCallback((): Promise<string> => {
    if (aiAttemptIdRef.current) {
      return Promise.resolve(aiAttemptIdRef.current);
    }
    if (startAttemptPromiseRef.current) {
      return startAttemptPromiseRef.current;
    }

    const pending = startAttemptMutation
      .mutateAsync({ challengeId })
      .then(({ attemptId }) => {
        aiAttemptIdRef.current = attemptId;
        setAiAttemptId(attemptId);
        return attemptId;
      })
      .finally(() => {
        startAttemptPromiseRef.current = null;
      });
    startAttemptPromiseRef.current = pending;
    return pending;
  }, [challengeId, startAttemptMutation]);

  // AI 코치 패널 폭 — 마지막으로 쓰던 값을 기억한다(브라우저별 저장).
  useEffect(() => {
    setAiPanelWidth(readAiPanelWidth());
  }, []);

  useEffect(() => {
    if (
      !isLoggedIn ||
      !hasGuestSession ||
      hasClaimedGuestRef.current ||
      claimGuestSessionMutation.isPending
    )
      return;
    hasClaimedGuestRef.current = true;
    claimGuestSessionMutation.mutate();
  }, [claimGuestSessionMutation, hasGuestSession, isLoggedIn]);

  const persistAiPanelWidth = (width: number) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(AI_PANEL_WIDTH_KEY, String(width));
    }
  };

  const handleAiPanelResizeStart = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    isDraggingAiPanelRef.current = true;
    const startX = event.clientX;
    const startWidth = aiPanelWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingAiPanelRef.current) return;
      const nextWidth = Math.min(
        Math.max(startWidth + (moveEvent.clientX - startX), AI_PANEL_MIN_WIDTH),
        AI_PANEL_MAX_WIDTH
      );
      setAiPanelWidth(nextWidth);
    };

    const handleMouseUp = () => {
      isDraggingAiPanelRef.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setAiPanelWidth((current) => {
        persistAiPanelWidth(current);
        return current;
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleToggleAiPanelWidth = () => {
    setAiPanelWidth((current) => {
      const next =
        current >= (AI_PANEL_NARROW_WIDTH + AI_PANEL_WIDE_WIDTH) / 2
          ? AI_PANEL_NARROW_WIDTH
          : AI_PANEL_WIDE_WIDTH;
      persistAiPanelWidth(next);
      return next;
    });
  };

  const handleToggleFocusMode = useCallback(() => {
    setIsFocusMode((current) => {
      const next = !current;
      if (next) {
        // 모바일 집중 모드: 문제 본문을 기본 접어 손풀이 자리를 확보(FINDING-001 반영).
        // 태블릿/웹은 같은 상태를 공유해도 아이콘 레일 접기로 이미 자리가 나므로 무해하다.
        setIsQuestionOpen(false);
      } else {
        setIsFocusCoachOpen(false);
      }
      return next;
    });
  }, []);

  // 끄기: 상단 "집중 모드 끄기" 버튼과 Esc. 둘 다 항상 동작해야 한다(시안 v2 §4 규칙 3).
  useEffect(() => {
    if (!isFocusMode) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleToggleFocusMode();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode, handleToggleFocusMode]);

  // oc_start: 문제 데이터가 처음 로드됐을 때 1회 발화
  useEffect(() => {
    if (!challenge || hasFiredStartRef.current) return;
    hasFiredStartRef.current = true;
    trackOcStart({
      problem_id: challengeId,
      src: searchParams.get('src') ?? 'direct',
    });
  }, [challenge, challengeId, searchParams]);

  const handleGuestSubmit = async () => {
    if (!selectedAnswer) {
      setSubmitError('답을 먼저 선택해 주세요.');
      choiceSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      choiceSectionRef.current?.focus();
      return;
    }

    try {
      const elapsedSeconds = Math.round(
        (Date.now() - mountTimeRef.current) / 1000
      );
      const { correct } = await guestGradeMutation.mutateAsync(
        hasGuestSession
          ? {
              selectedAnswer,
              elapsedSeconds,
              drawingData:
                drawingStrokes.length > 0
                  ? JSON.stringify(drawingStrokes)
                  : null,
            }
          : selectedAnswer
      );
      setGuestGradeResult(correct);

      trackOcSubmit({
        is_correct: correct,
        used_solution: false,
        hint_count: messageCountRef.current,
        elapsed: elapsedSeconds,
      });

      const solvedCount = bumpGuestSolvedCount();
      if (solvedCount >= GUEST_FREE_LIMIT) {
        setSignupTrigger('limit-reached');
        setIsSignupSheetOpen(true);
      } else if (correct) {
        setSignupTrigger('correct-answer');
        setIsSignupSheetOpen(true);
      }
    } catch {
      // mutation hook 내부 공통 에러 처리(handleApiError)로 위임한다.
    }
  };

  const submitSelectedAnswer = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsNoteSubmitting(true);
    try {
      await submitSelectedAnswerInner();
    } finally {
      submittingRef.current = false;
      setIsNoteSubmitting(false);
    }
  };

  const submitSelectedAnswerInner = async () => {
    if (!selectedAnswer) {
      setSubmitError('답을 먼저 선택해 주세요.');
      choiceSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      choiceSectionRef.current?.focus();
      return;
    }

    if (!isLoggedIn) {
      await handleGuestSubmit();
      return;
    }

    try {
      const attemptId = await ensureAttempt();

      if (aiSessionId) {
        try {
          await finishAiCoachingSessionMutation.mutateAsync(aiSessionId);
        } catch {
          // 세션 종료 실패가 답안 제출을 막지는 않도록 한다.
        }
        setAiSessionId(null);
      }

      const result = await submitAnswerMutation.mutateAsync({
        attemptId,
        params: { selectedAnswer },
      });

      // oc_submit 계측 (D2)
      trackOcSubmit({
        is_correct: result.isCorrect,
        used_solution: solutionViewedRef.current,
        hint_count: messageCountRef.current,
        elapsed: Math.round((Date.now() - mountTimeRef.current) / 1000),
      });

      // MVP-H 조각 1: 풀이노트가 만들어지면 공유까지 마치고 노트로 이동한다(use-solution-note-handoff).
      const outcome = await handoff({
        challengeId,
        attemptId,
        strokes: drawingStrokes,
        elapsedSeconds: Math.round((Date.now() - mountTimeRef.current) / 1000),
        shareDrawing,
      });
      if (outcome.kind === 'navigated') return;

      // D-14: 정오와 무관하게 손글씨가 있으면 문제를 푼 사람들에게 공유한다.
      // 실패해도 결과 화면 이동은 유지하되, 실패 사실과 재시도 정보를 결과에 넘긴다.
      const drawingShareFailure =
        drawingStrokes.length > 0
          ? await shareDrawing(challengeId, attemptId, drawingStrokes)
          : undefined;

      persistSolveResult(challengeId, drawingStrokes, {
        ...result,
        attemptId,
        selectedAnswer,
        drawingShareFailure,
      });
      router.push(PUBLIC.OPEN_CHALLENGE.RESULT(challengeId));
    } catch {
      // mutation hook에서 공통 API 에러 처리를 수행한다.
    }
  };

  const handleSubmit = () => {
    if (!selectedAnswer) {
      setSubmitError('답을 먼저 선택해 주세요.');
      choiceSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      choiceSectionRef.current?.focus();
      return;
    }

    if (drawingStrokes.length === 0) {
      setIsEmptyDrawingPromptOpen(true);
      return;
    }

    void submitSelectedAnswer();
  };

  const handleEmptyDrawingSubmit = () => {
    setIsEmptyDrawingPromptOpen(false);
    void submitSelectedAnswer();
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    setSubmitError('');
    setGuestGradeResult(null);
  };

  const handleAiAttemptCleared = () => {
    aiAttemptIdRef.current = null;
    startAttemptPromiseRef.current = null;
    setAiAttemptId(null);
    setAiSessionId(null);
  };

  if (isChallengeLoading) return <ChallengeSolveSkeleton />;

  if (isChallengeError || !challenge) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="font-body1-heading text-text-main">
          문제를 찾을 수 없어요.
        </p>
        <p className="text-gray-8 text-sm">
          링크가 잘못됐거나 삭제된 문제일 수 있어요.
        </p>
        <Button
          type="button"
          variant="outlined"
          onClick={() => router.push(PUBLIC.OPEN_CHALLENGE.LIST)}
        >
          문제 목록으로 가기
        </Button>
      </div>
    );
  }

  // 단답형(주관식)은 choices 가 비어있는 게 정상이다 — answerType 으로 구분한다.
  const isShortAnswer = challenge.answerType === 'SHORT_ANSWER';

  // 아직 지원하지 않는 문제 유형(선택지도 없고 단답형도 아님) — 직링크 진입 시 dead-end 방지.
  if (challenge.choices.length === 0 && !isShortAnswer) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="font-body1-heading text-text-main">
          아직 지원하지 않는 문제 유형이에요.
        </p>
        <p className="text-gray-8 text-sm">다른 문제를 풀어보시겠어요?</p>
        <Button
          type="button"
          variant="outlined"
          onClick={() => router.push(PUBLIC.OPEN_CHALLENGE.LIST)}
        >
          다른 문제 풀러가기
        </Button>
      </div>
    );
  }

  // 두 곳(기본/집중모드 오버레이)에서 같은 코치 패널을 그리므로 props를 한 곳에 모은다.
  const aiCoachPanelProps = {
    challengeId,
    attemptId: aiAttemptId,
    isLoggedIn,
    hasGuestSession,
    openingMessage: coachOpening?.message,
    ensureAttempt,
    onAttemptCleared: handleAiAttemptCleared,
    onSessionChange: setAiSessionId,
    drawingStrokes,
    onSolutionViewed: () => {
      solutionViewedRef.current = true;
    },
    onMessageSent: () => {
      messageCountRef.current += 1;
    },
  };

  // 오답률·등급대 정답률·배점 배지 — 값이 없으면 그 칩만 뺀다(전부 숨기지 않는다).
  const statBadges = [
    challenge.wrongAnswerRate != null && {
      key: 'wrong-rate',
      label: `오답률 ${challenge.wrongAnswerRate}%`,
      className: 'bg-orange-1 text-orange-8',
    },
    challenge.passRate != null && {
      key: 'pass-rate',
      label: `3~5등급 정답률 ${challenge.passRate}%`,
      className: 'bg-system-success-alt text-system-success-text',
    },
    challenge.points != null && {
      key: 'points',
      label: `배점 ${challenge.points}점`,
      className: 'bg-gray-1 text-text-main',
    },
  ].filter(Boolean) as { key: string; label: string; className: string }[];

  const answerPicker = isShortAnswer ? (
    <ShortAnswerInput
      value={selectedAnswer ?? ''}
      onChange={handleAnswerSelect}
    />
  ) : (
    <ChoiceList
      choices={challenge.choices}
      selected={selectedAnswer}
      onSelect={handleAnswerSelect}
    />
  );

  return (
    <div className="flex h-[calc(100vh-var(--spacing-header-height,64px))] overflow-hidden">
      {/* AI 코치 — 모바일에서 숨김. 평소엔 폭 드래그/토글, 집중 모드에선 48px 레일 + 겹침 오버레이 */}
      <aside
        className={cn(
          'border-line-line1 relative hidden shrink-0 border-r bg-white lg:block',
          isFocusMode ? 'lg:w-12' : 'p-4'
        )}
        style={isFocusMode ? undefined : { width: aiPanelWidth }}
      >
        {isFocusMode ? (
          <>
            <button
              type="button"
              onClick={() => setIsFocusCoachOpen((open) => !open)}
              aria-expanded={isFocusCoachOpen}
              aria-label="AI 코치 열기"
              data-testid="focus-coach-rail-toggle"
              className="text-gray-7 hover:bg-gray-1 flex h-full w-12 flex-col items-center justify-center gap-2"
            >
              <Bot size={18} />
              <span className="text-xs font-semibold tracking-wide [writing-mode:vertical-rl]">
                코치
              </span>
            </button>
            {isFocusCoachOpen && (
              <div
                className="border-line-line1 shadow-popover absolute top-0 left-12 z-30 h-full overflow-hidden border-r bg-white p-4"
                style={{ width: aiPanelWidth }}
              >
                <button
                  type="button"
                  onClick={() => setIsFocusCoachOpen(false)}
                  aria-label="AI 코치 닫기"
                  className="border-line-line1 text-gray-7 hover:bg-gray-1 absolute top-4 right-2 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border bg-white shadow-sm"
                >
                  <X size={14} />
                </button>
                <AiCoachPanel {...aiCoachPanelProps} />
              </div>
            )}
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={handleToggleAiPanelWidth}
              className="border-line-line1 text-gray-7 hover:bg-gray-1 absolute top-4 right-2 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border bg-white shadow-sm"
              aria-label="AI 코치 패널 폭 전환 (좁게/넓게)"
              data-testid="ai-panel-width-toggle"
            >
              <ChevronsLeftRight size={14} />
            </button>
            <AiCoachPanel {...aiCoachPanelProps} />
            {/* 드래그 리사이즈 핸들 */}
            <div
              onMouseDown={handleAiPanelResizeStart}
              role="separator"
              aria-orientation="vertical"
              aria-label="AI 코치 패널 폭 조절"
              data-testid="ai-panel-resize-handle"
              className="hover:bg-orange-3 absolute top-0 right-0 z-10 h-full w-1.5 -translate-x-1/2 cursor-col-resize"
            />
          </>
        )}
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 집중 모드 컨트롤 — 항상 보인다(스크롤 밖). 켜기 전=칩, 켜진 후=검은 띠 끄기 버튼 */}
        {isFocusMode ? (
          <div className="bg-gray-12 flex shrink-0 items-center justify-between gap-3 px-4 py-2 sm:px-6">
            <span className="text-sm font-semibold text-white max-sm:hidden">
              집중 모드
            </span>
            <Button
              type="button"
              variant="outlined"
              onClick={handleToggleFocusMode}
              data-testid="focus-mode-off-button"
              className="ml-auto h-8 gap-1.5 border-white/30 bg-transparent px-3 text-xs text-white hover:bg-white/10"
            >
              <Minimize2 size={14} />
              집중 모드 끄기
            </Button>
          </div>
        ) : (
          <div className="flex shrink-0 justify-end px-4 pt-3 sm:px-6">
            <button
              type="button"
              onClick={handleToggleFocusMode}
              data-testid="focus-mode-on-button"
              className="border-line-line1 text-text-main hover:bg-gray-1 rounded-pill flex h-8 items-center gap-1.5 border bg-white px-3 text-xs font-semibold"
            >
              <Maximize2 size={14} />
              집중 모드
            </button>
          </div>
        )}

        {/* 문제 + 선택지 + 풀이 에디터 */}
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-8">
          <div
            className={cn(
              'mb-5 flex items-center justify-between gap-3',
              isFocusMode && 'max-lg:hidden'
            )}
          >
            <BackButton />
            {isLoggedIn && (
              <ChallengeShareButton
                challengeId={Number(challengeId)}
                variant="outlined"
                size="small"
              />
            )}
          </div>

          <div
            className={cn(
              'text-gray-8 mb-3 flex min-w-0 items-center gap-2 text-sm',
              isFocusMode && 'max-lg:hidden'
            )}
          >
            <span>{challenge.subject}</span>
            <span>›</span>
            <span className="text-text-main truncate font-semibold">
              {challenge.topic}
            </span>
          </div>

          {invitePreview && (
            <section className="border-orange-7 bg-orange-1 mb-5 rounded-r-xl border-l-4 px-4 py-3">
              <button
                type="button"
                onClick={() => setIsInviteContextOpen((open) => !open)}
                aria-expanded={isInviteContextOpen}
                className="flex w-full items-center gap-3 text-left"
              >
                <span className="text-orange-10 flex size-9 shrink-0 items-center justify-center rounded-full bg-white font-bold">
                  {(invitePreview.inviterName ?? '친구').slice(0, 1)}
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="text-text-main block text-sm">
                    {invitePreview.inviterName ?? '친구'}님이 보낸 도전
                  </strong>
                  <span className="text-text-sub1 block truncate text-xs">
                    {invitePreview.opponentSolvedAt
                      ? `상대는 ${new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(invitePreview.opponentSolvedAt))}에 풀었어요`
                      : '상대가 푸는 중이에요'}
                  </span>
                </span>
                <span className="text-orange-10 text-xs font-bold">
                  {isInviteContextOpen
                    ? '도전 기록 접기'
                    : isInviteResultUnlocked
                      ? '결과가 열렸습니다'
                      : '도전 기록 보기'}
                </span>
              </button>
              {isInviteContextOpen && (
                <div className="border-orange-3 mt-3 grid gap-2 border-t pt-3 text-xs sm:grid-cols-3">
                  <span className="text-text-sub1">
                    보낸 시각
                    <br />
                    <b className="text-text-main">
                      {invitePreview.sentAt
                        ? new Intl.DateTimeFormat('ko-KR', {
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }).format(new Date(invitePreview.sentAt))
                        : '기록 없음'}
                    </b>
                  </span>
                  <span className="text-text-sub1">
                    상대 제출
                    <br />
                    <b className="text-text-main">
                      {invitePreview.opponentSolvedAt ? '제출 완료' : '푸는 중'}
                    </b>
                  </span>
                  <span className="text-text-sub1">
                    잠긴 기록
                    <br />
                    <b className="text-text-main">
                      {invitePreview.lockedFieldCount}개
                    </b>
                  </span>
                  {invitePreview.lockReason && (
                    <p className="text-text-sub1 sm:col-span-3">
                      {invitePreview.lockReason}
                    </p>
                  )}
                </div>
              )}
            </section>
          )}

          {hasChallengeHistory && (
            <div className="border-line-line1 bg-orange-1 mb-5 flex flex-col gap-3 rounded-xl border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-text-main font-semibold">
                  전에 도전했던 문제예요.
                </p>
                <p className="text-gray-8 mt-1 text-sm">
                  이전 답안과 공유한 풀이를 다시 확인할 수 있어요.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsHistoryOpen(true)}
                className="h-9 shrink-0 px-4 text-sm"
              >
                도전 내역 보기
              </Button>
            </div>
          )}

          {/*
            문제 카드: 제목 + 통계 배지 + 문제 본문(접기 가능, 높이 상한) + 답 고르기를
            한 카드에 붙이고 스크롤 상단에 고정한다(회장 결정 — 답 고르기를 문제 밑 붙박이로).
            손풀이 칸을 아무리 내려도 문제와 답 선택이 같이 따라온다.
          */}
          <div className="border-line-line1 sticky top-0 z-10 mb-5 overflow-hidden rounded-xl border bg-white">
            <button
              type="button"
              onClick={() =>
                setIsQuestionOpen(
                  (previousIsQuestionOpen) => !previousIsQuestionOpen
                )
              }
              className="hover:bg-gray-1 flex w-full cursor-pointer items-center justify-between gap-3 px-5 py-4 text-left sm:px-6"
              aria-expanded={isQuestionOpen}
            >
              <div className="min-w-0">
                <p className="text-text-main truncate text-base font-bold">
                  {challenge.topic}
                </p>
              </div>
              <span className="text-gray-7 flex shrink-0 items-center gap-1">
                {isFocusMode && (
                  <span className="text-xs font-semibold lg:hidden">
                    {isQuestionOpen ? '문제 접기' : '문제 보기'}
                  </span>
                )}
                {isQuestionOpen ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </span>
            </button>

            {statBadges.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 px-5 pb-3 sm:px-6">
                {statBadges.map((badge) => (
                  <span
                    key={badge.key}
                    data-testid={`challenge-stat-badge-${badge.key}`}
                    className={cn(
                      'rounded-pill px-2.5 py-1 text-xs font-semibold',
                      badge.className
                    )}
                  >
                    {badge.label}
                  </span>
                ))}
              </div>
            )}

            {isQuestionOpen && (
              <div
                className={cn(
                  'border-line-line1 overflow-y-auto border-t px-5 py-5 sm:px-6',
                  isFocusMode && 'max-lg:hidden'
                )}
                style={{ maxHeight: QUESTION_BODY_MAX_HEIGHT }}
              >
                <p className="text-text-main text-lg leading-relaxed whitespace-pre-line">
                  {challenge.questionText}
                </p>
                {challenge.questionImageUrl && (
                  <div className="border-line-line2 bg-gray-1 mt-5 overflow-hidden rounded-lg border p-3">
                    <Image
                      src={challenge.questionImageUrl}
                      alt={`${challenge.topic} 문제 이미지`}
                      width={760}
                      height={420}
                      className="max-h-105 w-full object-contain"
                    />
                  </div>
                )}
              </div>
            )}

            <div
              ref={choiceSectionRef}
              tabIndex={-1}
              className="border-line-line1 flex scroll-mt-6 flex-col gap-3 border-t px-5 py-5 outline-none sm:px-6"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-body1-heading text-text-main">
                  답을 직접 선택해 주세요
                </p>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => setIsMobileAiOpen(true)}
                  className="h-9 px-3 text-sm lg:hidden"
                >
                  <Bot
                    size={16}
                    className="mr-1"
                  />
                  AI 힌트
                </Button>
              </div>
              {answerPicker}
              {submitError && (
                <p className="text-system-warning text-sm font-semibold">
                  {submitError}
                </p>
              )}
            </div>
          </div>

          {/* 풀이 순서: 문제 → 답 고르기(붙박이) → 손풀이 → 제출 (회장 결정. fdd CD-E-01 문구는
              구 순서 "문제 → 손풀이 → 답 입력" 그대로라 어긋난다 — 아래 회수 항목 참조) */}
          <div className="mb-5 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Pencil
                size={18}
                className="text-orange-7"
              />
              <p className="font-body1-heading text-text-main">풀이 공간</p>
              <span className="text-gray-7 text-sm">
                펜으로 자유롭게 풀어보세요 (선택)
              </span>
            </div>

            <SolutionDrawingPad
              onStrokesChange={setDrawingStrokes}
              persistKey={`open-challenge-solve:${challengeId}`}
              height={
                isFocusMode
                  ? DRAWING_PAD_HEIGHT_FOCUS
                  : DRAWING_PAD_HEIGHT_DEFAULT
              }
            />
            <div
              className={cn(
                'border-orange-3 bg-orange-1 text-text-main rounded-xl border px-4 py-3 text-sm leading-relaxed',
                isFocusMode && 'max-lg:hidden'
              )}
            >
              이 손풀이는 이 문제를 푼 사람들에게 내 이름과 함께 보여요. 맞든
              틀리든 올라가고, 언제든 내릴 수 있어요. 내리면 30일 뒤 이미지가
              완전히 삭제돼요.
            </div>
          </div>

          {!isLoggedIn && guestGradeResult !== null && (
            <div
              data-testid="guest-grade-result"
              className={
                guestGradeResult
                  ? 'border-orange-3 bg-orange-1 text-orange-8 rounded-xl border px-4 py-3 text-sm font-semibold'
                  : 'border-line-line1 bg-gray-1 text-text-main rounded-xl border px-4 py-3 text-sm font-semibold'
              }
            >
              {guestGradeResult ? '정답이에요! 🎉' : '아쉽지만 오답이에요.'}
              <span className="text-gray-8 mt-1 block text-xs font-normal">
                레벨·포인트·약점트리는 가입하면 이 결과부터 쌓여요.
              </span>
            </div>
          )}
        </div>

        {/* 하단 제출 바 — 답 고르기가 문제 카드로 올라갔으니 이 바는 고른 답 표시 + 제출,
            두 조각만 남긴다(회장 결정). 되돌릴 수 있는 선택은 위에서, 되돌릴 수 없는 확정은
            아래에서 — 최저 56px로 얇게. */}
        <div className="border-line-line1 flex min-h-14 items-center gap-3 border-t bg-white px-4 py-2 sm:px-6">
          <p className="text-gray-8 min-w-0 flex-1 truncate text-sm">
            {selectedAnswer ? (
              <>
                <span className="text-text-main font-semibold">
                  {selectedAnswer}
                </span>
                {' 선택함'}
              </>
            ) : (
              '아직 답을 고르지 않았어요'
            )}
          </p>
          <Button
            onClick={handleSubmit}
            disabled={
              !selectedAnswer ||
              isSubmitting ||
              (!isLoggedIn && guestGradeResult !== null)
            }
            data-testid="challenge-submit-button"
            className="h-9 shrink-0 px-5 text-sm"
          >
            {isSubmitting
              ? '제출 중...'
              : selectedAnswer
                ? '제출하기'
                : '답 먼저 고르기'}
          </Button>
        </div>
      </div>

      <Dialog
        isOpen={isMobileAiOpen}
        onOpenChange={setIsMobileAiOpen}
      >
        <Dialog.Content className="h-[82vh] w-full max-w-[calc(100%-2rem)] gap-3 p-4 sm:max-w-120">
          <Dialog.Header>
            <div className="flex items-center justify-between gap-3">
              <Dialog.Title className="text-text-main text-base font-bold">
                AI 힌트
              </Dialog.Title>
              <button
                type="button"
                onClick={() => setIsMobileAiOpen(false)}
                className="hover:bg-gray-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full"
                aria-label="AI 힌트 닫기"
              >
                <X
                  size={18}
                  className="text-gray-7"
                />
              </button>
            </div>
          </Dialog.Header>
          <Dialog.Body>
            <AiCoachPanel
              challengeId={challengeId}
              attemptId={aiAttemptId}
              isLoggedIn={isLoggedIn}
              hasGuestSession={hasGuestSession}
              openingMessage={coachOpening?.message}
              ensureAttempt={ensureAttempt}
              onAttemptCleared={handleAiAttemptCleared}
              onSessionChange={setAiSessionId}
              drawingStrokes={drawingStrokes}
              onSolutionViewed={() => {
                solutionViewedRef.current = true;
              }}
              onMessageSent={() => {
                messageCountRef.current += 1;
              }}
            />
          </Dialog.Body>
        </Dialog.Content>
      </Dialog>

      {consentDialog}

      <ChallengeHistoryDialog
        challengeId={challengeId}
        challenge={challenge}
        isOpen={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
      />

      <Prompt
        isOpen={isEmptyDrawingPromptOpen}
        onOpenChange={setIsEmptyDrawingPromptOpen}
      >
        <Prompt.Content>
          <Prompt.Header>
            <Prompt.Title>손풀이 없이 제출할까요?</Prompt.Title>
            <Prompt.Description className="text-text-sub1 text-center text-sm">
              풀이 공간에 쓴 내용이 없어요. 실수로 비운 것은 아닌지 한 번 확인해
              주세요.
            </Prompt.Description>
          </Prompt.Header>
          <Prompt.Footer>
            <Prompt.Cancel>계속 풀기</Prompt.Cancel>
            <Prompt.Action onClick={handleEmptyDrawingSubmit}>
              손풀이 없이 제출
            </Prompt.Action>
          </Prompt.Footer>
        </Prompt.Content>
      </Prompt>

      <SignupSheet
        isOpen={isSignupSheetOpen}
        onOpenChange={setIsSignupSheetOpen}
        trigger={signupTrigger}
        challengeId={challengeId}
        isCorrect={guestGradeResult ?? undefined}
        hasGuestSession={hasGuestSession}
        inviteToken={inviteToken || undefined}
      />

      <Dialog
        isOpen={isLoginDialogOpen}
        onOpenChange={setIsLoginDialogOpen}
      >
        <Dialog.Content className="w-full max-w-90 gap-5 p-6 text-center">
          <Dialog.Header className="items-center">
            <div className="bg-orange-1 flex h-14 w-14 items-center justify-center rounded-full">
              <Bot
                size={28}
                className="text-orange-7"
              />
            </div>
            <Dialog.Title className="text-text-main text-lg font-bold">
              로그인이 필요해요
            </Dialog.Title>
            <Dialog.Description className="text-gray-8 text-sm leading-relaxed">
              문제를 풀고 기록을 남기려면 로그인이 필요해요.
            </Dialog.Description>
          </Dialog.Header>
          <Dialog.Footer className="flex-col">
            <Button
              type="button"
              onClick={() => {
                // 복귀 파라미터는 redirect 로 통일(도전장 흐름과 동일 규약).
                const redirect = encodeURIComponent(
                  PUBLIC.OPEN_CHALLENGE.DETAIL(challengeId)
                );
                router.replace(`${PUBLIC.CORE.LOGIN}?redirect=${redirect}`);
              }}
              className="w-full"
            >
              로그인하기
            </Button>
            <Button
              type="button"
              variant="outlined"
              onClick={() => setIsLoginDialogOpen(false)}
              className="w-full"
            >
              계속 둘러보기
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </div>
  );
};
