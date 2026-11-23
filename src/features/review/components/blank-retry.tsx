'use client';

import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { handwritingRepository } from '@/entities/handwriting';
import type { BlankRetryResult } from '@/entities/wrong-answer';
import { useWrongAnswersQuery } from '@/features/dashboard/hooks/use-wrong-answer-query';
import { useOpenChallengeDetailQuery } from '@/features/open-challenge/hooks/use-open-challenge';
import { Skeleton } from '@/shared/components/loading';
import {
  SolutionDrawingPad,
  type Stroke,
} from '@/shared/components/drawing';
import { Button, EmptyState, Input, showBottomToast } from '@/shared/components/ui';
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
  BLANK_SESSION_CLOSED: '시작한 지 오래돼 닫혔어요. 다시 시작해 주세요.',
  SELECTED_ANSWER_REQUIRED: '답을 먼저 골라 주세요.',
  SELF_JUDGEMENT_REQUIRED: '맞았는지 먼저 골라 주세요.',
};

const rewardText = (result: BlankRetryResult) => {
  if (result.reward.granted) return `+${result.reward.exp ?? 0} EXP`;
  return null;
};

const ResultPanel = ({ result }: { result: BlankRetryResult }) => {
  const reward = rewardText(result);
  return (
    <section
      aria-label="백지 결과"
      className="border-orange-9 rounded-section flex flex-col gap-3 border-2 bg-white p-card-pad"
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
  const [selfJudgement, setSelfJudgement] = useState<'CORRECT' | 'WRONG' | null>(
    null
  );
  const [result, setResult] = useState<BlankRetryResult | null>(null);
  const startedAtRef = useRef<number>(Date.now());
  const startedRef = useRef(false);
  // 손글씨 업로드가 끝나기 전에는 mutation 이 아직 pending 이 아니라서, 그 사이 두 번 눌리면 마무리가 두 번 나간다.
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

  const handleSubmit = async () => {
    if (sessionId === null || answerMissing || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const handwriting = await handwritingRepository.uploadHandwriting({
        strokes,
      });
      const saved = await finishMutation.mutateAsync({
        blankSessionId: sessionId,
        selfJudgement: hasAnswerField ? null : selfJudgement,
        selectedAnswer: hasAnswerField ? selectedAnswer.trim() : null,
        elapsedSeconds: Math.round((Date.now() - startedAtRef.current) / 1000),
        handwriting,
        stuckReasons: null,
      });
      setResult(saved);
    } catch (error) {
      const code = getApiError(error)?.code ?? '';
      showBottomToast(FINISH_ERROR_TEXT[code] ?? '저장하지 못했어요. 다시 시도해 주세요.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  if (startError) {
    return (
      <div className="mx-auto w-full max-w-page-max p-card-pad">
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
      <div className="mx-auto w-full max-w-page-max p-card-pad">
        <Skeleton.Block className="h-96 w-full" />
      </div>
    );
  }
  if (result) {
    return (
      <div className="mx-auto w-full max-w-content-max p-card-pad">
        <ResultPanel result={result} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-page-max flex-col gap-section-gap p-card-pad pb-32">
      <h1 className="font-headline1-heading text-text-main">
        백지에 다시 풀기
      </h1>
      <section
        aria-label="문제"
        className="border-line-line1 rounded-card flex flex-col gap-3 border bg-white p-card-pad"
      >
        <p className="font-body1-heading text-text-main">
          {challenge?.questionText ?? item?.questionText ?? item?.title ?? '문제'}
        </p>
        {(challenge?.questionImageUrl ?? item?.questionImageUrl) && (
          <span className="relative block h-64 w-full">
            <Image
              src={(challenge?.questionImageUrl ?? item?.questionImageUrl) as string}
              alt="문제"
              fill
              unoptimized
              className="object-contain object-left"
            />
          </span>
        )}
      </section>
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
                        'min-h-touch-min rounded-button border px-4 font-body2-heading',
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
      <div className="border-line-line1 fixed right-0 bottom-control-xl left-0 z-(--z-layer-chrome) flex justify-end border-t bg-white p-3 lg:bottom-0 lg:left-(--spacing-sidebar-width)">
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
    </div>
  );
};
