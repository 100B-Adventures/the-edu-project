'use client';

import { useState } from 'react';

import Link from 'next/link';

import { useGetTeacherNotesList } from '@/features/study-notes/hooks';
import { Skeleton } from '@/shared/components/loading';
import {
  Button,
  EmptyState,
  Input,
  showBottomToast,
} from '@/shared/components/ui';
import { PRIVATE } from '@/shared/constants';
import { Camera, Link2 } from 'lucide-react';

import {
  useAttachProblemMutation,
  useCreateShareLinkMutation,
  useNoteProblemsQueries,
  useSaveLessonInfoMutation,
  useTeacherLessonInfoQuery,
} from '../hooks/use-lesson';
import {
  DayRow,
  type NoteRow,
  StudentTabs,
  toLocalInput,
} from './teacher-lesson-parts';

type TeacherLessonProps = { studyRoomId: number };

const LIST_PAGEABLE = { page: 0, size: 20, sortKey: 'LATEST_EDITED' } as const;

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
    <div className="gap-section-gap flex flex-col">
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
      <div className="gap-section-gap grid 2xl:grid-cols-[1fr_320px]">
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
        <aside className="gap-section-gap flex flex-col">
          {attachNoteId !== null && (
            <section
              aria-label="같이 푼 문제 넣기"
              data-testid="lesson-attach"
              className="border-line-line1 rounded-card p-card-pad flex flex-col gap-3 border bg-white"
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
            className="border-line-line1 rounded-card p-card-pad flex flex-col gap-3 border bg-white"
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
