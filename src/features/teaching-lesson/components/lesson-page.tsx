'use client';

import { useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import type { NoteProblems } from '@/entities/teaching-note';
import { useGetStudentNotesList, useGetTeacherNotesList } from '@/features/study-notes/hooks';
import { Skeleton } from '@/shared/components/loading';
import { Button, EmptyState, Input, showBottomToast } from '@/shared/components/ui';
import { PRIVATE, PUBLIC } from '@/shared/constants';
import { getApiError } from '@/shared/lib';
import { useRole } from '@/shared/hooks/use-role';
import { Share2 } from 'lucide-react';

import {
  useAttachProblemMutation,
  useCreateShareLinkMutation,
  useLessonInfoQuery,
  useNoteProblemsQueries,
  useTeacherLessonInfoQuery,
  useSaveLessonInfoMutation,
  useSaveMemoMutation,
  useWeeklyQuestionMutation,
} from '../hooks/use-lesson';

type LessonPageProps = { studyRoomId: number };

type NoteRow = { id: number; title: string; taughtAt: string };

const LIST_PAGEABLE = { page: 0, size: 20, sortKey: 'LATEST_EDITED' } as const;

const toLocalInput = (iso: string | null | undefined) =>
  iso ? iso.slice(0, 16) : '';

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

const TeacherLesson = ({ studyRoomId }: LessonPageProps) => {
  const notes = useGetTeacherNotesList({
    studyRoomId,
    pageable: LIST_PAGEABLE,
  });
  const saveMutation = useSaveLessonInfoMutation(studyRoomId);
  const savedInfo = useTeacherLessonInfoQuery(studyRoomId);
  const shareMutation = useCreateShareLinkMutation();
  const attachMutation = useAttachProblemMutation();
  const [weeklyRule, setWeeklyRule] = useState<string | null>(null);
  const [nextAt, setNextAt] = useState<string | null>(null);
  const [minutes, setMinutes] = useState<string | null>(null);
  const [teacherNote, setTeacherNote] = useState<string | null>(null);
  const [attachId, setAttachId] = useState('');
  const [attachNoteId, setAttachNoteId] = useState<number | null>(null);
  const noteRows: NoteRow[] = notes.data?.content ?? [];
  const problemQueries = useNoteProblemsQueries(
    'teacher',
    noteRows.map((note) => note.id)
  );

  const saved = savedInfo.data;
  const handleSave = async () => {
    const minutesValue = Number(minutes ?? saved?.nextLesson?.minutes ?? 0);
    const atValue = nextAt ?? toLocalInput(saved?.nextLesson?.at);
    try {
      await saveMutation.mutateAsync({
        weeklyRule: weeklyRule ?? saved?.weekly ?? '',
        nextLessonAt: atValue ? `${atValue}:00` : null,
        minutes: Number.isFinite(minutesValue) && minutesValue > 0 ? minutesValue : null,
        mode: saved?.nextLesson?.mode ?? null,
        teacherNote: teacherNote ?? saved?.teacherNote ?? '',
      });
      showBottomToast('수업 정보를 저장했어요.');
    } catch {
      showBottomToast('저장하지 못했어요. 다시 시도해 주세요.');
    }
  };

  const handleShare = async (teachingNoteId: number) => {
    try {
      const link = await shareMutation.mutateAsync(teachingNoteId);
      await navigator.clipboard.writeText(link.url);
      showBottomToast('공유 링크를 복사했어요.');
    } catch {
      showBottomToast('공유 링크를 만들지 못했어요.');
    }
  };

  const handleAttach = async () => {
    const challengeId = Number(attachId);
    if (!attachNoteId || !Number.isInteger(challengeId) || challengeId <= 0) return;
    try {
      const result = await attachMutation.mutateAsync({
        teachingNoteId: attachNoteId,
        challengeId,
      });
      showBottomToast(
        `같이 푼 문제로 넣었어요. 학생 ${result.autoRegistered.studentCount}명의 N회독에 담겼어요.`
      );
      setAttachId('');
    } catch {
      showBottomToast('문제를 넣지 못했어요. 번호를 확인해 주세요.');
    }
  };

  return (
    <div className="grid gap-section-gap lg:grid-cols-[2fr_1fr]">
      <div className="flex flex-col gap-section-gap">
        <Panel
          title="수업노트"
          testId="lesson-notes"
        >
          {notes.isPending ? (
            <Skeleton.Block className="h-24 w-full" />
          ) : noteRows.length === 0 ? (
            <EmptyState title="수업노트가 아직 없어요" />
          ) : (
            <ul className="flex flex-col gap-2">
              {noteRows.map((note, index) => (
                <li
                  key={note.id}
                  className="border-line-line1 rounded-card flex flex-wrap items-center gap-3 border px-4 py-3"
                >
                  <span className="font-label-heading text-orange-10 shrink-0">
                    {formatDate(note.taughtAt)}
                  </span>
                  <span className="font-body1-heading text-text-main min-w-0 flex-1 truncate">
                    {note.title}
                  </span>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setAttachNoteId(note.id)}
                    aria-pressed={attachNoteId === note.id}
                    data-testid="lesson-attach-pick"
                  >
                    같이 푼 문제 넣기
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    className="gap-1.5"
                    onClick={() => void handleShare(note.id)}
                    data-testid="lesson-share"
                  >
                    <Share2
                      size={16}
                      aria-hidden="true"
                    />
                    공유
                  </Button>
                  {(problemQueries[index]?.data?.problems ?? []).length > 0 && (
                    <ul
                      className="w-full"
                      data-testid="lesson-note-problems"
                    >
                      {problemQueries[index]!.data!.problems.map((problem) => (
                        <li
                          key={problem.problemId}
                          className="font-body2-normal text-text-sub1 truncate"
                        >
                          {problem.title ?? '문제'}
                          {problem.solvedTogether ? ' · 같이 풂' : ''}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
        {attachNoteId !== null && (
          <Panel
            title="같이 푼 문제 넣기"
            testId="lesson-attach"
          >
            <Input
              aria-label="문제 번호"
              placeholder="문제 번호"
              inputMode="numeric"
              value={attachId}
              onChange={(event) => setAttachId(event.target.value)}
            />
            <Button
              disabled={!attachId.trim()}
              isLoading={attachMutation.isPending}
              onClick={() => void handleAttach()}
              data-testid="lesson-attach-submit"
            >
              넣기
            </Button>
          </Panel>
        )}
      </div>
      <Panel
        title="수업 정보"
        testId="lesson-info"
      >
        <Input
          aria-label="다음 수업"
          type="datetime-local"
          value={nextAt ?? toLocalInput(saved?.nextLesson?.at)}
          onChange={(event) => setNextAt(event.target.value)}
        />
        <Input
          aria-label="수업 시간(분)"
          inputMode="numeric"
          placeholder="분"
          value={minutes ?? (saved?.nextLesson?.minutes ? String(saved.nextLesson.minutes) : '')}
          onChange={(event) => setMinutes(event.target.value)}
        />
        <Input
          aria-label="정기 수업"
          placeholder="예: 화 목 19:00"
          value={weeklyRule ?? saved?.weekly ?? ''}
          maxLength={200}
          onChange={(event) => setWeeklyRule(event.target.value)}
        />
        <Input
          aria-label="선생님 한마디"
          placeholder="선생님 한마디"
          value={teacherNote ?? saved?.teacherNote ?? ''}
          maxLength={500}
          onChange={(event) => setTeacherNote(event.target.value)}
        />
        <Button
          isLoading={saveMutation.isPending}
          onClick={() => void handleSave()}
          data-testid="lesson-info-save"
        >
          저장
        </Button>
      </Panel>
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
      <h1 className="font-headline1-heading text-text-main">1:1 수업</h1>
      {role === 'ROLE_TEACHER' ? (
        <TeacherLesson studyRoomId={studyRoomId} />
      ) : (
        <StudentLesson studyRoomId={studyRoomId} />
      )}
    </div>
  );
};
