'use client';

import { useMemo } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import type { NoteDetail } from '@/entities/study-note';
import type { NoteProblems } from '@/entities/teaching-note';
import { useOpenChallengeDetailQuery } from '@/features/open-challenge/hooks/use-open-challenge';
import { useGetTeacherNoteDetail } from '@/features/study-notes/hooks';
import { parseEditorContent } from '@/shared/components/editor';
import { Button } from '@/shared/components/ui';
import { PRIVATE, PUBLIC } from '@/shared/constants';
import { Plus, RotateCcw } from 'lucide-react';

export type NoteRow = { id: number; title: string; taughtAt: string };
type NoteProblemRow = NoteProblems['problems'][number];

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;
const MAX_PHOTOS = 2;

export const toLocalInput = (iso: string | null | undefined) =>
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

export const ProblemCard = ({ problem }: { problem: NoteProblemRow }) => {
  const detail = useOpenChallengeDetailQuery(
    String(problem.challengeId ?? ''),
    {
      enabled:
        problem.challengeId !== null && problem.challengeId !== undefined,
    }
  );
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
              className="border-line-line2 rounded-pill font-label-heading text-text-main min-h-touch-min inline-flex items-center gap-1.5 border px-3 whitespace-nowrap"
            >
              <RotateCcw
                size={16}
                aria-hidden="true"
              />
              다시 풀기
            </Link>
          )}
          {problem.solvedTogether && (
            <span className="border-orange-9 rounded-pill font-label-heading text-orange-10 min-h-touch-min inline-flex items-center border px-3 whitespace-nowrap">
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

export const DayRow = ({
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
      className="border-line-line1 py-section-gap grid gap-3 border-b xl:grid-cols-[96px_1fr]"
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
              className="border-line-line1 bg-gray-1 rounded-card relative block h-28 overflow-hidden border"
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

export const StudentTabs = ({ noteId }: { noteId: number }) => {
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
              ? 'border-orange-9 rounded-pill font-body2-heading text-text-main min-h-touch-min inline-flex items-center border-2 bg-white px-4'
              : 'border-line-line2 rounded-pill font-body2-heading text-text-main min-h-touch-min inline-flex items-center border bg-white px-4'
          }
        >
          {student.studentName}
        </Link>
      ))}
    </nav>
  );
};
