'use client';

import { useEffect, useRef, useState } from 'react';

import { EditShell } from '@/features/edit-shell/components/edit-shell';
import { scheduleApi } from '@/features/schedule/api/schedule-api';
import { collaborationApi } from '@/features/unit-note/api/collaboration-api';
import { saveNoteDraft } from '@/features/unit-note/lib/note-draft-store';
import { SolutionDrawingPad, type Stroke } from '@/shared/components/drawing';
import { Button } from '@/shared/components/ui/button';
import { useMutation } from '@tanstack/react-query';

import { ReferenceDrawer } from './reference-drawer';

export const NoteWritePage = ({
  nodeId,
  pageId,
}: {
  nodeId: number;
  pageId: number;
}) => {
  const [text, setText] = useState('');
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const startedAt = useRef(new Date().toISOString());
  const [savedVersion, setSavedVersion] = useState<number | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(
      () => setElapsedSeconds((value) => value + 1),
      1000
    );
    return () => window.clearInterval(timer);
  }, []);
  const save = useMutation({
    mutationFn: () =>
      collaborationApi.saveVersion(
        nodeId,
        pageId,
        JSON.stringify({ text, strokes, savedAt: new Date().toISOString() })
      ),
    onSuccess: (result) => {
      setSavedVersion(result.versionNo);
      setDraftSaved(false);
      void scheduleApi
        .createActivitySession({
          kind: 'NOTE_WRITE',
          startedAt: startedAt.current,
          endedAt: new Date().toISOString(),
          refType: 'UNIT_NOTE_PAGE',
          refId: pageId,
        })
        .catch(() => undefined);
    },
    onError: async () => {
      await saveNoteDraft(
        `${nodeId}:${pageId}`,
        JSON.stringify({ text, strokes })
      );
      setDraftSaved(true);
    },
  });

  return (
    <main className="px-section-gap py-section-gap gap-block-gap mx-auto flex w-full max-w-280 flex-col">
      <header>
        <p className="font-label-heading text-orange-10">개념노트 쓰기</p>
        <h1 className="font-headline1-heading text-gray-12">
          내 말로 다시 적어봐요
        </h1>
        <p
          className="font-body2-normal text-gray-9"
          aria-live="off"
        >
          활동 {Math.floor(elapsedSeconds / 60)}분 {elapsedSeconds % 60}초
        </p>
      </header>
      <EditShell
        extraPanels={[
          {
            id: 'references',
            label: '참고자료',
            content: <ReferenceDrawer pageId={pageId} />,
          },
        ]}
      >
        <section className="border-line-line1 rounded-card p-card-pad gap-content-gap flex min-h-96 flex-col border bg-white">
          <label
            htmlFor="note-handwriting"
            className="font-body1-heading text-gray-12"
          >
            필기 판
          </label>
          <SolutionDrawingPad
            height={360}
            persistKey={`note-write:${nodeId}:${pageId}`}
            onStrokesChange={setStrokes}
          />
          <textarea
            id="note-handwriting"
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="border-line-line2 rounded-input font-body1-normal p-card-pad min-h-24 w-full resize-none border"
            placeholder="필기에 덧붙일 설명이 있으면 적어보세요"
          />
          <div className="flex items-center justify-between">
            <p className="font-body2-normal text-gray-9">
              {draftSaved
                ? '저장하지 못해 이 기기에 초안을 남겼어요.'
                : savedVersion
                  ? `판 ${savedVersion} 저장됨`
                  : '저장하면 새 판이 쌓여요.'}
            </p>
            <Button
              disabled={!text.trim() && strokes.length === 0}
              isLoading={save.isPending}
              onClick={() => save.mutate()}
            >
              새 판 저장
            </Button>
          </div>
        </section>
      </EditShell>
    </main>
  );
};
