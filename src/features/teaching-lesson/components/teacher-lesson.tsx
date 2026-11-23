'use client';

import { useMemo, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import type { NoteDetail } from '@/entities/study-note';
import type { NoteProblems } from '@/entities/teaching-note';
import { useOpenChallengeDetailQuery } from '@/features/open-challenge/hooks/use-open-challenge';
import {
  useGetTeacherNoteDetail,
  useGetTeacherNotesList,
} from '@/features/study-notes/hooks';
import { parseEditorContent } from '@/shared/components/editor';
import { Skeleton } from '@/shared/components/loading';
import {
  Button,
  EmptyState,
  Input,
  showBottomToast,
} from '@/shared/components/ui';
import { PRIVATE, PUBLIC } from '@/shared/constants';
import { Camera, Link2, Plus, RotateCcw } from 'lucide-react';

import {
  useAttachProblemMutation,
  useCreateShareLinkMutation,
  useNoteProblemsQueries,
  useSaveLessonInfoMutation,
  useTeacherLessonInfoQuery,
} from '../hooks/use-lesson';

type TeacherLessonProps = { studyRoomId: number };

type NoteRow = { id: number; title: string; taughtAt: string };
type NoteProblemRow = NoteProblems['problems'][number];

const LIST_PAGEABLE = { page: 0, size: 20, sortKey: 'LATEST_EDITED' } as const;
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;
const MAX_PHOTOS = 2;

const toLocalInput = (iso: string | null | undefined) =>
  iso ? iso.slice(0, 16) : '';

const formatDay = (iso: string) => {
  const date = new Date(iso);
  return {
    date: `${date.getMonth() + 1}/${date.getDate()}`,
    weekday: WEEKDAYS[date.getDay()],
  };
};

type EditorNode = {
  type?: string;
  attrs?: { src?: string };
  content?: EditorNode[];
};

/** 수업노트 본문(에디터 JSON)에서 판서 사진 주소만 뽑는다. */
const extractPhotoUrls = (content: string | undefined): string[] => {
  if (!content) return [];
  const urls: string[] = [];
  const walk = (node: EditorNode) => {
    if (node.type === 'image' && node.attrs?.src) urls.push(node.attrs.src);
    node.content?.forEach(walk);
  };
  walk(parseEditorContent(content) as EditorNode);
  return urls;
};

const ProblemCard = ({ problem }: { problem: NoteProblemRow }) => {
  const detail = useOpenChallengeDetailQuery(String(problem.challengeId ?? ''), {
    enabled: problem.challengeId !== null && problem.challengeId !== undefined,
  });
  const photo = detail.data?.questionImageUrl ?? null;
  return (
    <li
      className="border-line-line1 rounded-card flex min-w-0 flex-col overflow-hidden border bg-white"
      data-testid="lesson-problem-card"
    >
      <span className="bg-gray-1 relative block h-28 w-full">
        {photo && (
          <Image
            src={photo}
            alt=""
            fill
            unoptimized
            className="object-contain"
          />
        )}
      </span>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <span className="font-body2-heading text-text-main truncate">
          {problem.title ?? '문제'}
        </span>
        <div className="mt-auto flex flex-wrap gap-2">
          {problem.challengeId && (
            <Link
              href={PUBLIC.OPEN_CHALLENGE.DETAIL(problem.challengeId)}
              className="border-line-line2 rounded-pill font-label-heading text-text-main inline-flex min-h-touch-min items-center gap-1.5 whitespace-nowrap border px-3"
            >
              <RotateCcw
                size={16}
                aria-hidden="true"
              />
              다시 풀기
            </Link>
          )}
          {problem.solvedTogether && (
            <span className="border-orange-9 rounded-pill font-label-heading text-orange-10 inline-flex min-h-touch-min items-center whitespace-nowrap border px-3">
              N회독에 담김
            </span>
          )}
        </div>
      </div>
    </li>
  );
};

type DayRowProps = {
  studyRoomId: number;
  note: NoteRow;
  problems: NoteProblemRow[];
  hint: string | null;
  isAttachOpen: boolean;
  onPickAttach: () => void;
  onShare: () => void;
};

const DayRow = ({
  studyRoomId,
  note,
  problems,
  hint,
  isAttachOpen,
  onPickAttach,
  onShare,
}: DayRowProps) => {
  const detail = useGetTeacherNoteDetail(note.id);
  const content = (detail.data as NoteDetail | undefined)?.resolvedContent
    ?.content;
  const photos = useMemo(() => extractPhotoUrls(content), [content]);
  const shown = photos.slice(0, MAX_PHOTOS);
  const day = formatDay(note.taughtAt);
  return (
    <li
      className="border-line-line1 grid gap-3 border-b py-section-gap xl:grid-cols-[96px_1fr]"
      data-testid="lesson-day"
    >
      <div>
        <p className="font-headline2-heading text-text-main">{day.date}</p>
        <p className="font-body2-normal text-text-sub1">{day.weekday}</p>
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        <div className="grid grid-cols-3 gap-2">
          {shown.map((url) => (
            <span
              key={url}
              className="border-line-line1 bg-gray-1 relative block h-28 overflow-hidden rounded-card border"
            >
              <Image
                src={url}
                alt="판서 사진"
                fill
                unoptimized
                className="object-cover"
              />
            </span>
          ))}
          <Link
            href={PRIVATE.NOTE.EDIT(studyRoomId, note.id)}
            className="border-orange-9 text-orange-10 font-label-heading rounded-card flex h-28 flex-col items-center justify-center gap-1 border-2 border-dashed"
            data-testid="lesson-add-photo"
          >
            <Plus
              size={20}
              aria-hidden="true"
            />
            사진
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-body1-heading text-text-main min-w-0 basis-full truncate">
            {note.title}
          </h3>
          <Button
            variant="outlined"
            size="small"
            onClick={onPickAttach}
            aria-pressed={isAttachOpen}
            data-testid="lesson-attach-pick"
          >
            같이 푼 문제 넣기
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={onShare}
            data-testid="lesson-share"
          >
            공유 링크 복사
          </Button>
        </div>
        {problems.length > 0 && (
          <div data-testid="lesson-note-problems">
            <h4 className="font-body2-heading text-text-main mb-2">
              같이 푼 문제
            </h4>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {problems.map((problem) => (
                <ProblemCard
                  key={problem.problemId}
                  problem={problem}
                />
              ))}
            </ul>
          </div>
        )}
        {hint && (
          <div
            className="border-orange-9 bg-orange-1 rounded-card border-l-4 px-4 py-3"
            data-testid="lesson-hint"
          >
            <p className="font-label-heading text-orange-10">선생님 힌트</p>
            <p className="font-body1-heading text-text-main whitespace-pre-wrap">
              {hint}
            </p>
          </div>
        )}
      </div>
    </li>
  );
};

const StudentTabs = ({ noteId }: { noteId: number }) => {
  const detail = useGetTeacherNoteDetail(noteId);
  const students = (detail.data as NoteDetail | undefined)?.studentInfos ?? [];
  if (students.length === 0) return null;
  return (
    <nav
      aria-label="학생"
      className="flex flex-wrap gap-2"
      data-testid="lesson-student-tabs"
    >
      {students.map((student, index) => (
        <Link
          key={student.studentId}
          href={PRIVATE.DASHBOARD.TEACHER_STUDENT(student.studentId)}
          aria-current={index === 0 ? 'true' : undefined}
          className={
            index === 0
              ? 'border-orange-9 rounded-pill font-body2-heading text-text-main inline-flex min-h-touch-min items-center border-2 bg-white px-4'
              : 'border-line-line2 rounded-pill font-body2-heading text-text-main inline-flex min-h-touch-min items-center border bg-white px-4'
          }
        >
          {student.studentName}
        </Link>
      ))}
    </nav>
  );
};

export const TeacherLesson = ({ studyRoomId }: TeacherLessonProps) => {
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
  const firstNoteId = noteRows[0]?.id;

  const handleSave = async () => {
    const minutesValue = Number(minutes ?? saved?.nextLesson?.minutes ?? 0);
    const atValue = nextAt ?? toLocalInput(saved?.nextLesson?.at);
    try {
      await saveMutation.mutateAsync({
        weeklyRule: weeklyRule ?? saved?.weekly ?? '',
        nextLessonAt: atValue ? `${atValue}:00` : null,
        minutes:
          Number.isFinite(minutesValue) && minutesValue > 0
            ? minutesValue
            : null,
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
      if (typeof navigator.share === 'function') {
        await navigator.share({ url: link.url, title: '1:1 수업노트' });
        return;
      }
      await navigator.clipboard.writeText(link.url);
      showBottomToast('공유 링크를 복사했어요.');
    } catch {
      showBottomToast('공유 링크를 만들지 못했어요.');
    }
  };

  const handleAttach = async () => {
    const challengeId = Number(attachId);
    if (!attachNoteId || !Number.isInteger(challengeId) || challengeId <= 0)
      return;
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
    <div className="flex flex-col gap-section-gap">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-headline1-heading text-text-main mr-auto">
          1:1 수업
        </h1>
        <Button
          variant="outlined"
          className="gap-2"
          disabled={firstNoteId === undefined}
          isLoading={shareMutation.isPending}
          onClick={() =>
            firstNoteId !== undefined && void handleShare(firstNoteId)
          }
          data-testid="lesson-share-top"
        >
          <Link2
            size={18}
            aria-hidden="true"
          />
          카톡으로 공유
        </Button>
        <Button
          asChild
          className="gap-2"
        >
          <Link
            href={PRIVATE.NOTE.CREATE(studyRoomId)}
            data-testid="lesson-upload-photo"
          >
            <Camera
              size={18}
              aria-hidden="true"
            />
            판서 사진 올리기
          </Link>
        </Button>
      </div>
      {firstNoteId !== undefined && <StudentTabs noteId={firstNoteId} />}
      <div className="grid gap-section-gap 2xl:grid-cols-[1fr_320px]">
        <section
          aria-label="수업노트"
          data-testid="lesson-notes"
          className="min-w-0"
        >
          {notes.isPending ? (
            <Skeleton.Block className="h-60 w-full" />
          ) : noteRows.length === 0 ? (
            <EmptyState title="수업노트가 아직 없어요" />
          ) : (
            <ul className="flex flex-col">
              {noteRows.map((note, index) => (
                <DayRow
                  key={note.id}
                  studyRoomId={studyRoomId}
                  note={note}
                  problems={problemQueries[index]?.data?.problems ?? []}
                  hint={index === 0 ? (saved?.teacherNote ?? null) : null}
                  isAttachOpen={attachNoteId === note.id}
                  onPickAttach={() => setAttachNoteId(note.id)}
                  onShare={() => void handleShare(note.id)}
                />
              ))}
            </ul>
          )}
        </section>
        <aside className="flex flex-col gap-section-gap">
          {attachNoteId !== null && (
            <section
              aria-label="같이 푼 문제 넣기"
              data-testid="lesson-attach"
              className="border-line-line1 rounded-card flex flex-col gap-3 border bg-white p-card-pad"
            >
              <h2 className="font-headline2-heading text-text-main">
                같이 푼 문제 넣기
              </h2>
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
            </section>
          )}
          <section
            aria-label="수업 정보"
            data-testid="lesson-info"
            className="border-line-line1 rounded-card flex flex-col gap-3 border bg-white p-card-pad"
          >
            <h2 className="font-headline2-heading text-text-main">수업 정보</h2>
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
              value={
                minutes ??
                (saved?.nextLesson?.minutes
                  ? String(saved.nextLesson.minutes)
                  : '')
              }
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
          </section>
        </aside>
      </div>
    </div>
  );
};
