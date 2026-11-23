'use client';

import { useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import type { NoteProblems } from '@/entities/teaching-note';
import { useGetStudentNotesList } from '@/features/study-notes/hooks';
import { Skeleton } from '@/shared/components/loading';
import { Button, Input, showBottomToast } from '@/shared/components/ui';
import { PRIVATE, PUBLIC } from '@/shared/constants';
import { getApiError } from '@/shared/lib';
import { useRole } from '@/shared/hooks/use-role';

import {
  useLessonInfoQuery,
  useNoteProblemsQueries,
  useSaveMemoMutation,
  useWeeklyQuestionMutation,
} from '../hooks/use-lesson';
import { TeacherLesson } from './teacher-lesson';

type LessonPageProps = { studyRoomId: number };

type NoteRow = { id: number; title: string; taughtAt: string };

const LIST_PAGEABLE = { page: 0, size: 20, sortKey: 'LATEST_EDITED' } as const;

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return '';
  const date = new Date(iso);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const formatNextLesson = (
  next: { at?: string | null; minutes?: number | null; mode?: string | null } | null | undefined
) => {
  if (!next?.at) return null;
  const date = new Date(next.at);
  const time = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  return [time, next.minutes ? `${next.minutes}분` : null, next.mode]
    .filter(Boolean)
    .join(' · ');
};

const Panel = ({
  title,
  children,
  testId,
}: {
  title: string;
  children: React.ReactNode;
  testId?: string;
}) => (
  <section
    aria-label={title}
    data-testid={testId}
    className="border-line-line1 rounded-card flex flex-col gap-3 border bg-white p-card-pad"
  >
    <h2 className="font-headline2-heading text-text-main">{title}</h2>
    {children}
  </section>
);

type NoteProblemRow = NoteProblems['problems'][number];

const ProblemList = ({ problems }: { problems: NoteProblemRow[] }) => {
  const router = useRouter();
  if (problems.length === 0) {
    return (
      <p className="font-body2-normal text-text-sub1">같이 푼 문제가 없어요.</p>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {problems.map((problem) => (
        <li key={problem.problemId}>
          <Button
            variant="unstyled"
            data-testid="lesson-problem"
            disabled={!problem.challengeId}
            onClick={() =>
              problem.challengeId &&
              router.push(PUBLIC.OPEN_CHALLENGE.DETAIL(problem.challengeId))
            }
            className="border-line-line1 rounded-card hover:border-orange-9 flex min-h-touch-min w-full items-center justify-between gap-3 border px-4 py-3 text-left"
          >
            <span className="font-body1-heading text-text-main truncate">
              {problem.title ?? '문제'}
            </span>
            {problem.solvedTogether && (
              <span className="font-label-heading text-orange-10 shrink-0">
                같이 풂
              </span>
            )}
          </Button>
        </li>
      ))}
    </ul>
  );
};

const StudentLesson = ({ studyRoomId }: LessonPageProps) => {
  const info = useLessonInfoQuery(studyRoomId);
  const notes = useGetStudentNotesList({
    studyRoomId,
    pageable: LIST_PAGEABLE,
  });
  const memoMutation = useSaveMemoMutation(studyRoomId);
  const [memo, setMemo] = useState<string | null>(null);
  const weeklyMutation = useWeeklyQuestionMutation(studyRoomId);
  const [qTitle, setQTitle] = useState('');
  const [qBody, setQBody] = useState('');
  const noteRows: NoteRow[] = notes.data?.content ?? [];
  const problemQueries = useNoteProblemsQueries(
    'student',
    noteRows.map((note) => note.id)
  );
  const problems = problemQueries.flatMap((query) => query.data?.problems ?? []);
  const memoValue = memo ?? info.data?.myMemo ?? '';
  const nextLesson = formatNextLesson(info.data?.nextLesson);

  const handleSaveMemo = async () => {
    try {
      await memoMutation.mutateAsync(memoValue);
      showBottomToast('메모를 저장했어요.');
    } catch {
      showBottomToast('저장하지 못했어요. 다시 시도해 주세요.');
    }
  };

  const handleAsk = async () => {
    try {
      await weeklyMutation.mutateAsync({
        title: qTitle.trim(),
        content: qBody.trim(),
      });
      setQTitle('');
      setQBody('');
      showBottomToast('선생님께 질문을 보냈어요.');
    } catch (error) {
      const code = getApiError(error)?.code ?? '';
      showBottomToast(
        code === 'WEEKLY_QUESTION_LIMIT'
          ? '이번 주 질문은 이미 보냈어요.'
          : '질문을 보내지 못했어요. 다시 시도해 주세요.'
      );
    }
  };

  return (
    <div className="grid gap-section-gap lg:grid-cols-[2fr_1fr]">
      <div className="flex flex-col gap-section-gap">
        <Panel
          title="배운 것"
          testId="lesson-notes"
        >
          {notes.isPending ? (
            <Skeleton.Block className="h-24 w-full" />
          ) : noteRows.length === 0 ? (
            <p className="font-body2-normal text-text-sub1">수업노트가 아직 없어요.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {noteRows.map((note) => (
                <li key={note.id}>
                  <Link
                    href={PRIVATE.NOTE.DETAIL(studyRoomId, note.id)}
                    className="border-line-line1 rounded-card hover:border-orange-9 flex min-h-touch-min items-center gap-3 border px-4 py-3"
                  >
                    <span className="font-label-heading text-orange-10 shrink-0">
                      {formatDate(note.taughtAt)}
                    </span>
                    <span className="font-body1-heading text-text-main truncate">
                      {note.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel
          title="같이 푼 문제"
          testId="lesson-problems"
        >
          {notes.isPending || problemQueries.some((query) => query.isPending) ? (
            <Skeleton.Block className="h-24 w-full" />
          ) : (
            <ProblemList problems={problems} />
          )}
        </Panel>
      </div>
      <div className="flex flex-col gap-section-gap">
        <Panel
          title="다음 수업"
          testId="lesson-next"
        >
          {info.isPending ? (
            <Skeleton.Block className="h-12 w-full" />
          ) : (
            <p className="font-body1-heading text-text-main">
              {nextLesson ?? '정해진 수업이 없어요.'}
            </p>
          )}
          {info.data?.weekly && (
            <p className="font-body2-normal text-text-sub1">{info.data.weekly}</p>
          )}
        </Panel>
        {info.data?.teacherNote && (
          <Panel title="선생님 한마디">
            <p className="font-body1-normal text-text-main whitespace-pre-wrap">
              {info.data.teacherNote}
            </p>
          </Panel>
        )}
        <Panel
          title="선생님께 질문"
          testId="lesson-weekly"
        >
          <Input
            aria-label="질문 제목"
            placeholder="제목"
            maxLength={100}
            value={qTitle}
            onChange={(event) => setQTitle(event.target.value)}
          />
          <Input
            aria-label="질문 내용"
            placeholder="내용"
            value={qBody}
            onChange={(event) => setQBody(event.target.value)}
          />
          <Button
            disabled={!qTitle.trim() || !qBody.trim()}
            isLoading={weeklyMutation.isPending}
            onClick={() => void handleAsk()}
            data-testid="lesson-weekly-send"
          >
            보내기
          </Button>
        </Panel>
        <Panel
          title="내 메모"
          testId="lesson-memo"
        >
          <Input
            aria-label="메모 입력"
            value={memoValue}
            maxLength={500}
            onChange={(event) => setMemo(event.target.value)}
          />
          <Button
            isLoading={memoMutation.isPending}
            onClick={() => void handleSaveMemo()}
            data-testid="lesson-memo-save"
          >
            저장
          </Button>
        </Panel>
      </div>
    </div>
  );
};

export const LessonPage = ({ studyRoomId }: LessonPageProps) => {
  const { role, isLoading } = useRole();
  if (isLoading) {
    return <Skeleton.Block className="h-60 w-full" />;
  }
  return (
    <div className="flex flex-col gap-section-gap">
      {role === 'ROLE_TEACHER' ? (
        <TeacherLesson studyRoomId={studyRoomId} />
      ) : (
        <>
          <h1 className="font-headline1-heading text-text-main">1:1 수업</h1>
          <StudentLesson studyRoomId={studyRoomId} />
        </>
      )}
    </div>
  );
};
