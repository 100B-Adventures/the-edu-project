'use client';

import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import {
  handwritingRepository,
  settleDeferredStrokes,
} from '@/entities/handwriting';
import type { BlankRetryResult } from '@/entities/wrong-answer';
import { useWrongAnswersQuery } from '@/features/dashboard/hooks/use-wrong-answer-query';
import { EditShell } from '@/features/edit-shell/components/edit-shell';
import { useOpenChallengeDetailQuery } from '@/features/open-challenge/hooks/use-open-challenge';
import { useHandwritingConsent } from '@/features/solution-note/use-handwriting-consent';
import { SolutionDrawingPad, type Stroke } from '@/shared/components/drawing';
import { Skeleton } from '@/shared/components/loading';
import {
  Button,
  EmptyState,
  Input,
  showBottomToast,
} from '@/shared/components/ui';
import { PRIVATE } from '@/shared/constants';
import { cn } from '@/shared/lib';
import { getApiError } from '@/shared/lib';

import {
  useFinishBlankRetryMutation,
  useStartBlankSessionMutation,
} from '../hooks/use-review';

type BlankRetryProps = { wrongAnswerId: number };

const START_ERROR_TEXT: Record<string, string> = {
  WRONG_ANSWER_REVIEW_NOT_DUE: '아직 다시 풀 날이 아니에요.',
  WRONG_ANSWER_ALREADY_GRADUATED: '이미 졸업한 문제예요.',
  WRONG_ANSWER_NOT_FOUND: '찾을 수 없는 문제예요.',
};

const FINISH_ERROR_TEXT: Record<string, string> = {
  WRONG_ANSWER_ALREADY_REVIEWED_TODAY: '오늘은 이미 이 문제를 다시 풀었어요.',
  BLANK_SESSION_CLOSED: '이 풀이는 이미 끝났어요.',
  SELECTED_ANSWER_REQUIRED: '답을 먼저 골라 주세요.',
  SELF_JUDGEMENT_REQUIRED: '맞았는지 먼저 골라 주세요.',
};

/** 시간이 지나 세션이 닫혔을 때(BLANK_SESSION_EXPIRED). 쓴 필기는 지우지 않는다(교차 리뷰 P1-13). */
const ExpiredSessionCard = ({
  onRestart,
  onViewNotes,
  restarting,
}: {
  onRestart: () => void;
  onViewNotes: () => void;
  restarting: boolean;
}) => (
  <section
    role="alert"
    aria-label="세션 만료"
    data-testid="blank-expired"
    className="border-orange-9 bg-orange-1 rounded-card p-card-pad flex flex-col gap-3 border"
  >
    <p className="font-body1-heading text-text-main">
      시간이 지나 이 풀이 세션이 닫혔어요. 쓴 필기는 그대로 남아 있어요.
    </p>
    <div className="flex gap-2">
      <Button
        variant="outlined"
        onClick={onViewNotes}
        data-testid="blank-expired-view"
      >
        필기 보기
      </Button>
      <Button
        isLoading={restarting}
        onClick={onRestart}
        data-testid="blank-expired-restart"
      >
        새로 시작하기
      </Button>
    </div>
  </section>
);

const rewardText = (result: BlankRetryResult) => {
  if (result.reward.granted) return `+${result.reward.exp ?? 0} EXP`;
  return null;
};

const ResultPanel = ({ result }: { result: BlankRetryResult }) => {
  const reward = rewardText(result);
  return (
    <section
      aria-label="백지 결과"
      className="border-orange-9 rounded-section p-card-pad flex flex-col gap-3 border-2 bg-white"
      data-testid="blank-result"
    >
      <h2 className="font-headline2-heading text-text-main">
        {result.countedAsReview ? `${result.reviewCount}회독` : '저장했어요'}
        {result.graduated && ' · 졸업'}
      </h2>
      {reward && (
        <p
          className="font-headline2-heading text-orange-10"
          data-testid="blank-reward"
        >
          {reward}
        </p>
      )}
      {result.nextReviewAt && !result.graduated && (
        <p className="font-body2-normal text-text-sub1">
          다음 회독 {result.nextReviewAt.slice(5, 10).replace('-', '/')}
        </p>
      )}
      <Button
        asChild
        size="large"
      >
        <Link href={PRIVATE.DASHBOARD.STUDENT_REVIEW}>N회독으로</Link>
      </Button>
    </section>
  );
};

export const BlankRetry = ({ wrongAnswerId }: BlankRetryProps) => {
  const startMutation = useStartBlankSessionMutation();
  const finishMutation = useFinishBlankRetryMutation(wrongAnswerId);
  const wrongAnswers = useWrongAnswersQuery();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [selfJudgement, setSelfJudgement] = useState<
    'CORRECT' | 'WRONG' | null
  >(null);
  const [result, setResult] = useState<BlankRetryResult | null>(null);
  const [expired, setExpired] = useState(false);
  const startedAtRef = useRef<number>(Date.now());
  const startedRef = useRef(false);
  // 손글씨 업로드가 끝나기 전에는 mutation 이 아직 pending 이 아니라서, 그 사이 두 번 눌리면 마무리가 두 번 나간다.
  const { ensureConsent, consentDialog } = useHandwritingConsent();
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  const item = wrongAnswers.data?.items.find(
    (candidate) => candidate.id === wrongAnswerId
  );
  const challengeId = item?.challengeId ?? null;
  const challengeQuery = useOpenChallengeDetailQuery(
    challengeId ? String(challengeId) : '',
    { enabled: challengeId !== null }
  );
  const challenge = challengeQuery.data;
  const hasAnswerField = challengeId !== null;

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    startMutation.mutate(wrongAnswerId, {
      onSuccess: (session) => {
        setSessionId(session.blankSessionId);
        startedAtRef.current = Date.now();
      },
      onError: (error) => {
        const code = getApiError(error)?.code ?? '';
        setStartError(START_ERROR_TEXT[code] ?? '시작하지 못했어요.');
      },
    });
    // 세션은 화면에 들어올 때 한 번만 연다(서버가 열린 세션을 재사용한다).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrongAnswerId]);

  const answerMissing = hasAnswerField
    ? selectedAnswer.trim() === ''
    : selfJudgement === null;

  const handleRestart = () => {
    startMutation.mutate(wrongAnswerId, {
      onSuccess: (session) => {
        setSessionId(session.blankSessionId);
        startedAtRef.current = Date.now();
        setExpired(false);
      },
      onError: () =>
        showBottomToast('새로 시작하지 못했어요. 다시 시도해 주세요.'),
    });
  };

  const handleSubmit = async () => {
    if (sessionId === null || answerMissing || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      // 동의 확인이 업로드보다 먼저다(D-128). 동의하지 않으면 획 좌표만 빼고 PNG 한 장으로 보낸다(FDD §5.1).
      let strokesSaved = await ensureConsent();
      let handwriting = await handwritingRepository.uploadHandwriting({
        strokes,
        pngOnly: !strokesSaved,
      });
      const payload = {
        blankSessionId: sessionId,
        selfJudgement: hasAnswerField ? null : selfJudgement,
        selectedAnswer: hasAnswerField ? selectedAnswer.trim() : null,
        elapsedSeconds: Math.round((Date.now() - startedAtRef.current) / 1000),
        handwriting,
        stuckReasons: null,
      };
      let saved;
      try {
        saved = await finishMutation.mutateAsync(payload);
      } catch (error) {
        if (getApiError(error)?.code !== 'CONSENT_REQUIRED') throw error;
        // 동의 버전이 바뀐 경우: 다시 묻는다. 거절해도 멈추지 않고 획 없는 PNG 로 다시 보낸다(2회차 P1-5).
        const before = strokesSaved;
        strokesSaved = await ensureConsent(true);
        if (before !== strokesSaved) {
          handwriting = await handwritingRepository.uploadHandwriting({
            strokes,
            pngOnly: !strokesSaved,
          });
          payload.handwriting = handwriting;
        }
        saved = await finishMutation.mutateAsync(payload);
      }
      // 획 업로드만 실패해 PNG 로 저장됐다면 보관함에 넣고 다시 붙인다(교차 리뷰 P1-9). 획을 올리지 않은 저장은 건너뛴다.
      if (strokesSaved) {
        await settleDeferredStrokes(handwriting, saved.handwriting, strokes);
      }
      setResult(saved);
    } catch (error) {
      const code = getApiError(error)?.code ?? '';
      if (code === 'BLANK_SESSION_EXPIRED') {
        // 필기는 그대로 두고 새 세션을 열 길을 보인다.
        setExpired(true);
        return;
      }
      showBottomToast(
        FINISH_ERROR_TEXT[code] ?? '저장하지 못했어요. 다시 시도해 주세요.'
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  if (startError) {
    return (
      <div className="max-w-page-max p-card-pad mx-auto w-full">
        <EmptyState
          title={startError}
          action={
            <Button
              asChild
              variant="outlined"
            >
              <Link href={PRIVATE.DASHBOARD.STUDENT_REVIEW}>N회독으로</Link>
            </Button>
          }
        />
      </div>
    );
  }
  if (sessionId === null || wrongAnswers.isPending) {
    return (
      <div className="max-w-page-max p-card-pad mx-auto w-full">
        <Skeleton.Block className="h-96 w-full" />
      </div>
    );
  }
  if (result) {
    return (
      <div className="max-w-content-max p-card-pad mx-auto w-full">
        <ResultPanel result={result} />
      </div>
    );
  }

  return (
    <div className="max-w-page-max gap-section-gap p-card-pad mx-auto flex w-full flex-col pb-32">
      <h1 className="font-headline1-heading text-text-main">
        백지에 다시 풀기
      </h1>
      <EditShell challengeId={challengeId ?? undefined}>
        <div className="gap-section-gap flex flex-col">
      <section
        aria-label="문제"
        className="border-line-line1 rounded-card p-card-pad flex flex-col gap-3 border bg-white"
      >
        <p className="font-body1-heading text-text-main">
          {challenge?.questionText ??
            item?.questionText ??
            item?.title ??
            '문제'}
        </p>
        {(challenge?.questionImageUrl ?? item?.questionImageUrl) && (
          <span className="relative block h-64 w-full">
            <Image
              src={
                (challenge?.questionImageUrl ??
                  item?.questionImageUrl) as string
              }
              alt="문제"
              fill
              unoptimized
              className="object-contain object-left"
            />
          </span>
        )}
      </section>
      {expired && (
        <ExpiredSessionCard
          onRestart={handleRestart}
          onViewNotes={() => setExpired(false)}
          restarting={startMutation.isPending}
        />
      )}
      <SolutionDrawingPad
        onStrokesChange={setStrokes}
        persistKey={`mvph-blank:${wrongAnswerId}`}
      />
      {hasAnswerField ? (
        <section
          aria-label="답"
          className="flex flex-col gap-2"
        >
          {challenge?.answerType === 'MULTIPLE_CHOICE' ? (
            <ul className="flex flex-wrap gap-2">
              {challenge.choices.map((choice) => {
                const on = selectedAnswer === choice;
                return (
                  <li key={choice}>
                    <Button
                      variant="unstyled"
                      aria-pressed={on}
                      onClick={() => setSelectedAnswer(choice)}
                      data-testid="blank-choice"
                      className={cn(
                        'min-h-touch-min rounded-button font-body2-heading border px-4',
                        on
                          ? 'border-orange-9 bg-orange-1 text-orange-10'
                          : 'border-line-line2 bg-white'
                      )}
                    >
                      {choice}
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Input
              aria-label="답"
              placeholder="답"
              value={selectedAnswer}
              onChange={(event) => setSelectedAnswer(event.target.value)}
            />
          )}
        </section>
      ) : (
        <section
          aria-label="맞았나요"
          className="flex gap-2"
        >
          <Button
            variant={selfJudgement === 'CORRECT' ? 'primary' : 'outlined'}
            onClick={() => setSelfJudgement('CORRECT')}
          >
            맞았어요
          </Button>
          <Button
            variant={selfJudgement === 'WRONG' ? 'primary' : 'outlined'}
            onClick={() => setSelfJudgement('WRONG')}
          >
            틀렸어요
          </Button>
        </section>
      )}
        </div>
      </EditShell>
      <div className="border-line-line1 bottom-control-xl fixed right-0 left-0 z-(--z-layer-chrome) flex justify-end border-t bg-white p-3 lg:bottom-0 lg:left-(--spacing-sidebar-width)">
        <Button
          size="large"
          disabled={answerMissing}
          isLoading={submitting || finishMutation.isPending}
          onClick={() => void handleSubmit()}
          data-testid="blank-submit"
        >
          다 풀었어요
        </Button>
      </div>
      {consentDialog}
    </div>
  );
};
