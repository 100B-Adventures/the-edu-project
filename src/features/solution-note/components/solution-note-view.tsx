'use client';

import { useRef, useState } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { handwritingRepository } from '@/entities/handwriting';
import {
  solutionNoteRepository,
  type SolutionNoteDetail,
} from '@/entities/solution-note';
import { reviewRepository } from '@/entities/wrong-answer';
import { useOpenChallengeDetailQuery } from '@/features/open-challenge/hooks/use-open-challenge';
import { Skeleton } from '@/shared/components/loading';
import { SolutionDrawingPad, type Stroke } from '@/shared/components/drawing';
import { savePageStrokes } from '@/shared/components/drawing/model/drawing-storage';
import { BackButton, Button, EmptyState, showBottomToast } from '@/shared/components/ui';
import { PRIVATE } from '@/shared/constants';
import { cn } from '@/shared/lib';
import { getApiError } from '@/shared/lib';
import { ChevronDown, Pencil } from 'lucide-react';

import { NOTE_LABEL_TEXT } from '../../review/review-labels';
import { computeDiffMarks } from '../diff-marks';
import {
  useReviseSolutionNoteMutation,
  useSaveStuckReasonsMutation,
  useSolutionExplanationQuery,
  useSolutionNoteDetailQuery,
} from '../hooks/use-solution-note';
import { StuckReasonChips } from './stuck-reason-chips';

type SolutionNoteViewProps = { solutionNoteId: number };

const REVISE_REASON_TEXT: Record<string, string> = {
  NO_CHANGE: '바뀐 곳이 없어 보상은 없어요',
  DAILY_CAP: '오늘 보상 한도를 채웠어요',
  DAILY_PROBLEM_LIMIT: '오늘 고치기 보상 문제 수를 채웠어요',
  ALREADY_GRANTED: '이 문제는 이미 보상을 받았어요',
};

const formatSubmittedAt = (iso: string | undefined) => {
  if (!iso) return '';
  const date = new Date(iso);
  return `${date.getMonth() + 1}/${date.getDate()} 제출`;
};

const stuckRequiredMessage = '틀린 문제는 하나는 골라야 N회독에 들어가요.';

const Labels = ({ detail }: { detail: SolutionNoteDetail }) => (
  <div className="flex flex-wrap gap-2">
    <span
      className="rounded-pill font-caption-heading min-h-badge-min bg-system-success-alt text-system-success-text inline-flex items-center px-3"
      data-testid="note-posted-chip"
    >
      풀이노트에 올렸어요
    </span>
    {detail.isCorrect !== null && (
      <span
        className={cn(
          'rounded-pill font-caption-heading min-h-badge-min inline-flex items-center px-3',
          detail.isCorrect
            ? 'bg-system-success-alt text-system-success-text'
            : 'bg-orange-1 text-orange-10'
        )}
      >
        {detail.isCorrect ? '맞았어요' : '틀렸어요'}
      </span>
    )}
    {detail.labels.map((label) => (
      <span
        key={label}
        className="rounded-pill font-caption-heading border-line-line2 text-text-sub1 min-h-badge-min inline-flex items-center border bg-white px-3"
      >
        {NOTE_LABEL_TEXT[label] ?? label}
      </span>
    ))}
  </div>
);

const ProblemBand = ({ challengeId }: { challengeId: number | null }) => {
  const [open, setOpen] = useState(false);
  const challengeQuery = useOpenChallengeDetailQuery(
    challengeId ? String(challengeId) : '',
    { enabled: challengeId !== null }
  );
  const challenge = challengeQuery.data;
  if (!challenge) return null;
  return (
    <section
      aria-label="문제"
      className="border-line-line1 rounded-card border bg-white p-card-pad"
    >
      <Button
        variant="unstyled"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-11 w-full items-center justify-between gap-3 text-left"
      >
        <span
          className={cn(
            'font-body1-heading text-text-main',
            !open && 'truncate'
          )}
        >
          {challenge.questionNumber}. {challenge.questionText}
        </span>
        <ChevronDown
          size={20}
          aria-hidden="true"
          className={cn('shrink-0', open && 'rotate-180')}
        />
      </Button>
      {open && challenge.questionImageUrl && (
        <span className="relative mt-3 block h-60 w-full">
          <Image
            src={challenge.questionImageUrl}
            alt="문제"
            fill
            unoptimized
            className="object-contain object-left"
          />
        </span>
      )}
    </section>
  );
};

const IMAGE_MARKDOWN = /!\[([^\]]*)\]\(([^)\s]+)\)/g;

/** 해설 원문의 마크다운 이미지(![설명](주소))는 그림으로, 나머지는 글로 그린다. */
export const ExplanationText = ({ text }: { text: string }) => {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(IMAGE_MARKDOWN)) {
    const index = match.index ?? 0;
    if (index > last) parts.push(text.slice(last, index));
    parts.push(
      // eslint-disable-next-line @next/next/no-img-element -- 해설 이미지는 크기를 알 수 없는 외부 주소
      <img
        key={`${index}-${match[2]}`}
        src={match[2]}
        alt={match[1] || '해설 그림'}
        className="my-2 h-auto max-w-full"
      />
    );
    last = index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
};

const ExplanationPane = ({ solutionNoteId }: { solutionNoteId: number }) => {
  const explanationQuery = useSolutionExplanationQuery(solutionNoteId);
  return (
    <section
      aria-label="해설"
      className="border-line-line1 rounded-card flex min-w-0 flex-col border bg-white"
    >
      <header className="border-line-line1 flex items-center gap-2 border-b p-card-pad">
        <h2 className="font-headline2-heading text-text-main">해설</h2>
        {explanationQuery.data && explanationQuery.data.cost.points > 0 && (
          <span className="font-caption-heading text-orange-10 bg-orange-1 rounded-pill px-3 py-1">
            {explanationQuery.data.cost.points} P
          </span>
        )}
      </header>
      <div className="flex flex-col gap-3 p-card-pad">
        {explanationQuery.isPending && <Skeleton.Block className="h-40 w-full" />}
        {explanationQuery.isError && (
          <EmptyState
            title="해설을 불러오지 못했어요"
            action={
              <Button
                variant="outlined"
                onClick={() => void explanationQuery.refetch()}
              >
                다시 시도
              </Button>
            }
          />
        )}
        {explanationQuery.data?.steps.map((step) => (
          <article
            key={step.no}
            data-testid="explanation-step"
            className="border-line-line1 rounded-card border p-card-pad"
          >
            <h3 className="font-body1-heading text-text-main">
              {step.no}. {step.tag ?? ''}
            </h3>
            <p className="font-body1-normal text-text-main mt-1 whitespace-pre-wrap">
              <ExplanationText text={step.text} />
            </p>
          </article>
        ))}
        {explanationQuery.data &&
          explanationQuery.data.steps.length === 0 &&
          explanationQuery.data.fullText && (
            <p className="font-body1-normal text-text-main whitespace-pre-wrap">
              <ExplanationText text={explanationQuery.data.fullText} />
            </p>
          )}
      </div>
    </section>
  );
};

export const SolutionNoteView = ({ solutionNoteId }: SolutionNoteViewProps) => {
  const router = useRouter();
  const detailQuery = useSolutionNoteDetailQuery(solutionNoteId);
  const reviseMutation = useReviseSolutionNoteMutation(solutionNoteId);
  const stuckMutation = useSaveStuckReasonsMutation(solutionNoteId);
  const [fixing, setFixing] = useState(false);
  const [padKey, setPadKey] = useState<string | undefined>(undefined);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const baseStrokesRef = useRef<Stroke[]>([]);
  const [localReasons, setLocalReasons] = useState<string[] | null>(null);
  const startedAtRef = useRef<number>(Date.now());

  const detail = detailQuery.data;
  const reasons = localReasons ?? detail?.stuckReasons ?? [];

  const handleStartFix = async () => {
    if (!detail) return;
    const key = `mvph-fix:${solutionNoteId}:${detail.currentVersionNo}`;
    baseStrokesRef.current = [];
    try {
      const version = await solutionNoteRepository.getVersion(
        solutionNoteId,
        detail.currentVersionNo
      );
      if (version.strokesUrl) {
        const previous = await handwritingRepository.fetchStrokes(
          version.strokesUrl
        );
        baseStrokesRef.current = previous;
        await savePageStrokes(key, 0, previous);
      }
    } catch {
      // 획을 못 받아도 빈 패드에서 고칠 수 있다. PNG 는 위에 그대로 보인다.
    }
    startedAtRef.current = Date.now();
    setPadKey(key);
    setFixing(true);
  };

  const handleSaveFix = async () => {
    if (!detail) return;
    try {
      const handwriting = await handwritingRepository.uploadHandwriting({
        strokes,
      });
      const saved = await reviseMutation.mutateAsync({
        handwriting,
        diffMarks: computeDiffMarks(baseStrokesRef.current, strokes),
        elapsedSeconds: Math.round((Date.now() - startedAtRef.current) / 1000),
        baseVersionNo: detail.currentVersionNo,
      });
      if (saved.reward.granted) {
        showBottomToast(`+${saved.reward.exp ?? 0} EXP`);
      } else {
        showBottomToast(
          REVISE_REASON_TEXT[saved.reward.reason ?? ''] ?? '고친 풀이를 저장했어요.'
        );
      }
      setFixing(false);
    } catch (error) {
      const code = getApiError(error)?.code;
      if (code === 'SOLUTION_NOTE_VERSION_CONFLICT') {
        showBottomToast('다른 곳에서 먼저 저장했어요. 새로 불러올게요.');
        await detailQuery.refetch();
        setFixing(false);
        return;
      }
      showBottomToast('저장하지 못했어요. 다시 시도해 주세요.');
    }
  };

  const handleToggleReason = async (code: string) => {
    if (!detail) return;
    const next = reasons.includes(code)
      ? reasons.filter((item) => item !== code)
      : [...reasons, code];
    const previous = reasons;
    setLocalReasons(next);
    try {
      const saved = await stuckMutation.mutateAsync(next);
      if (saved.suggestImport && detail.challengeAttemptId) {
        await reviewRepository.importProblems({
          channel: 'SOLVED_TODAY',
          challengeAttemptIds: [detail.challengeAttemptId],
        });
        showBottomToast('N회독에 넣었어요.');
      }
    } catch (error) {
      setLocalReasons(previous);
      if (getApiError(error)?.code === 'STUCK_REASON_REQUIRED') {
        showBottomToast(stuckRequiredMessage);
        return;
      }
      showBottomToast('저장하지 못했어요. 다시 시도해 주세요.');
    }
  };

  if (detailQuery.isPending) {
    return (
      <div className="mx-auto w-full max-w-page-max p-card-pad">
        <Skeleton.Block className="h-96 w-full" />
      </div>
    );
  }
  if (detailQuery.isError || !detail) {
    return (
      <div className="mx-auto w-full max-w-page-max p-card-pad">
        <EmptyState
          title="풀이노트를 찾을 수 없어요"
          action={
            <Button
              variant="outlined"
              onClick={() => void detailQuery.refetch()}
            >
              다시 시도
            </Button>
          }
        />
      </div>
    );
  }

  const latest = detail.versions.find(
    (version) => version.versionNo === detail.currentVersionNo
  );
  const diffCount = latest?.diffMarks.length ?? 0;
  const canBlank =
    detail.isCorrect === false && detail.wrongAnswer?.status === 'ACTIVE';

  return (
    <div className="mx-auto flex w-full max-w-page-max flex-col gap-section-gap p-card-pad pb-48 lg:pb-32">
      <header className="flex flex-wrap items-center gap-3">
        <BackButton className="min-h-11" />
        <h1 className="font-headline1-heading text-text-main">풀이노트</h1>
        <span className="font-label-normal text-text-sub1">
          {formatSubmittedAt(detail.versions[0]?.createdAt)}
        </span>
        <Labels detail={detail} />
      </header>
      <ProblemBand challengeId={detail.challengeId} />
      <div className="grid min-w-0 gap-section-gap lg:grid-cols-2">
        <section
          aria-label="내 풀이"
          className="border-line-line1 rounded-card flex min-w-0 flex-col border bg-white"
        >
          <header className="border-line-line1 flex flex-wrap items-center gap-2 border-b p-card-pad">
            <h2 className="font-headline2-heading text-text-main">내 풀이</h2>
            <span className="font-label-normal text-text-sub1">고치기</span>
            {diffCount > 0 && (
              <span
                className="font-caption-heading text-orange-10 border-orange-9 rounded-pill ml-auto border px-3 py-1"
                data-testid="diff-count"
              >
                다른 곳 {diffCount}
              </span>
            )}
          </header>
          <div className="p-card-pad">
            {fixing ? (
              <SolutionDrawingPad
                persistKey={padKey}
                onStrokesChange={setStrokes}
              />
            ) : latest?.pngUrl ? (
              <span className="relative block min-h-96 w-full overflow-hidden bg-white">
                <Image
                  src={latest.pngUrl}
                  alt="제출한 풀이"
                  width={1024}
                  height={1400}
                  unoptimized
                  className="h-auto w-full"
                />
              </span>
            ) : (
              <p className="font-body2-normal text-text-sub1">
                풀이 그림이 없어요.
              </p>
            )}
          </div>
        </section>
        <ExplanationPane solutionNoteId={solutionNoteId} />
      </div>
      <div className="border-line-line1 fixed right-0 bottom-control-xl left-0 z-(--z-layer-chrome) flex flex-col gap-3 border-t bg-white p-3 lg:bottom-0 lg:left-(--spacing-sidebar-width) lg:flex-row lg:items-center">
        <div className="min-w-0 lg:flex-1">
          <StuckReasonChips
            selected={reasons}
            disabled={stuckMutation.isPending}
            onToggle={(code) => void handleToggleReason(code)}
          />
        </div>
        <div className="flex gap-2 [&>button]:flex-1 lg:[&>button]:flex-none">
          {fixing ? (
            <Button
              size="large"
              isLoading={reviseMutation.isPending}
              onClick={() => void handleSaveFix()}
              data-testid="note-save-fix"
            >
              고친 풀이 저장
            </Button>
          ) : (
            <Button
              size="large"
              variant="outlined"
              className="gap-2"
              onClick={() => void handleStartFix()}
              data-testid="note-start-fix"
            >
              <Pencil
                size={18}
                aria-hidden="true"
              />
              고치기
            </Button>
          )}
          {canBlank && detail.wrongAnswer && (
            <Button
              size="large"
              variant="outlined"
              onClick={() =>
                router.push(
                  PRIVATE.DASHBOARD.STUDENT_REVIEW_BLANK(detail.wrongAnswer!.id)
                )
              }
              data-testid="note-to-blank"
            >
              백지에 다시 풀기
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
