'use client';

import Image from 'next/image';
import Link from 'next/link';

import type { UnitNoteDetail } from '@/entities/unit-note';
import { monthDayLabel } from '@/features/app-shell/model/format';
import { useUnitNoteDetailQuery } from '@/features/unit-note/hooks/use-unit-note-query';
import { useNotePins } from '@/features/unit-note/hooks/use-note-collaboration';
import { ScreenState } from '@/shared/components/screen-state';
import { Button } from '@/shared/components/ui/button';
import { PRIVATE } from '@/shared/constants';

import { useStudentNoteDetailQuery } from '../../hooks/use-student-note-detail';

type NoteViewerProps = {
  nodeId: number;
  /** 있으면 선생님이 그 학생 노트를 읽는 읽기 전용 화면(N7). */
  studentId?: number;
};

const SidePanel = ({
  detail,
  showProblems,
  pageId,
}: {
  detail: UnitNoteDetail;
  showProblems: boolean;
  pageId?: number;
}) => (
  <SidePanelContent detail={detail} showProblems={showProblems} pageId={pageId} />
);

const SidePanelContent = ({
  detail,
  showProblems,
  pageId,
}: {
  detail: UnitNoteDetail;
  showProblems: boolean;
  pageId?: number;
}) => {
  const pins = useNotePins(pageId);
  return (
  <aside
    className="gap-block-gap flex flex-col"
    aria-label="노트 옆 패널"
  >
    <section className="border-line-line1 rounded-card p-card-pad gap-content-gap flex flex-col border bg-white">
      <h2 className="font-body2-heading text-text-main">
        자료 {detail.teachingLayers.length}
      </h2>
      <ul className="gap-content-gap flex flex-col">
        {detail.teachingLayers.map((layer) => (
          <li
            key={layer.teachingNoteId}
            className="font-body2-normal text-gray-10"
          >
            <span className="text-text-main font-bold">{layer.title}</span>
            {layer.taughtAt && (
              <span className="text-gray-8 ml-1">
                {monthDayLabel(layer.taughtAt)}
              </span>
            )}
            <p className="text-two-lines text-gray-9">{layer.summary}</p>
          </li>
        ))}
      </ul>
    </section>
    {showProblems && (
      <section className="border-line-line1 rounded-card p-card-pad gap-content-gap flex flex-col border bg-white">
        <h2 className="font-body2-heading text-text-main">
          이 개념 쓰는 문제 {detail.relatedProblems.length}
        </h2>
        <ul className="gap-content-gap flex flex-col">
          {detail.relatedProblems.map((problem) => (
            <li key={problem.wrongAnswerId}>
              <Link
                href={PRIVATE.DASHBOARD.WRONG_ANSWER_REVIEW(
                  problem.wrongAnswerId
                )}
                className="font-body2-normal text-gray-10 text-single-line"
              >
                {problem.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    )}
    <section className="border-line-line1 rounded-card p-card-pad border bg-white">
      <h2 className="font-body2-heading text-text-main">핀 {pins.data?.length ?? 0}</h2>
      {(pins.data?.length ?? 0) === 0 ? (
        <p className="font-body2-normal text-gray-9">선생님 핀이 달리면 여기에 보여요</p>
      ) : (
        <ul className="gap-inline-gap mt-content-gap flex flex-col">
          {pins.data?.map((pin) => (
            <li key={pin.id} className="bg-orange-1 rounded-control-compact p-content-gap font-body2-normal text-orange-11">
              {pin.body}
            </li>
          ))}
        </ul>
      )}
    </section>
  </aside>
  );
};

/** 노트 크게 보기 + 오른쪽 패널. 선생님은 같은 화면을 읽기 전용으로 본다(AC-68c). */
export const NoteViewer = ({ nodeId, studentId }: NoteViewerProps) => {
  const own = useUnitNoteDetailQuery(studentId ? 0 : nodeId);
  const students = useStudentNoteDetailQuery(studentId ?? 0, nodeId);
  const query = studentId ? students : own;
  const detail = query.data?.detail;

  const forbidden =
    studentId !== undefined &&
    (students.error as { response?: { status?: number } } | null)?.response
      ?.status === 403;

  return (
    <div
      className="px-section-gap py-section-gap mx-auto w-full max-w-280"
      data-testid="note-viewer"
      data-readonly={studentId ? 'true' : 'false'}
    >
      <ScreenState
        status={
          forbidden
            ? 'forbidden'
            : query.isError
              ? 'error'
              : query.isPending
                ? 'loading'
                : !detail || detail.pages.length === 0
                  ? 'empty'
                  : 'ready'
        }
        error={{ onRetry: () => query.refetch() }}
        empty={{ title: '아직 올린 노트가 없어요' }}
        forbidden={{ title: '같은 방의 학생 노트만 볼 수 있어요' }}
      >
        {detail && (
          <div className="gap-block-gap flex flex-col">
            {studentId === undefined && detail.pages[0] && (
              <Button asChild className="self-end">
                <Link href={PRIVATE.DASHBOARD.UNIT_NOTE_WRITE(nodeId, detail.pages[0].pageId)}>
                  노트 쓰기
                </Link>
              </Button>
            )}
            <div className="gap-block-gap shell:grid shell:grid-cols-[1fr_20rem] flex flex-col">
            <ol className="gap-block-gap flex min-w-0 flex-col">
              {detail.pages.map((page) => (
                <li key={page.pageId}>
                  {page.viewUrl && (
                    <Image
                      src={page.viewUrl}
                      alt={`${page.position}쪽`}
                      width={1200}
                      height={1600}
                      unoptimized
                      className="rounded-card border-line-line1 h-auto w-full border bg-white"
                    />
                  )}
                </li>
              ))}
            </ol>
            <SidePanel
              detail={detail}
              showProblems={studentId === undefined}
              pageId={detail.pages[0]?.pageId}
            />
            </div>
          </div>
        )}
      </ScreenState>
    </div>
  );
};
