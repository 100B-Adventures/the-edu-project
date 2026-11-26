'use client';

import { useState } from 'react';

import { EditShell } from '@/features/edit-shell/components/edit-shell';
import { collaborationApi } from '@/features/unit-note/api/collaboration-api';
import { saveNoteDraft } from '@/features/unit-note/lib/note-draft-store';
import { Button } from '@/shared/components/ui/button';
import { useMutation } from '@tanstack/react-query';

import { ReferenceDrawer } from './reference-drawer';

export const NoteWritePage = ({ nodeId, pageId }: { nodeId: number; pageId: number }) => {
  const [text, setText] = useState('');
  const [savedVersion, setSavedVersion] = useState<number | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const save = useMutation({
    mutationFn: () =>
      collaborationApi.saveVersion(
        nodeId,
        pageId,
        JSON.stringify({ text, savedAt: new Date().toISOString() })
      ),
    onSuccess: (result) => {
      setSavedVersion(result.versionNo);
      setDraftSaved(false);
    },
    onError: async () => {
      await saveNoteDraft(`${nodeId}:${pageId}`, text);
      setDraftSaved(true);
    },
  });

  return (
    <main className="px-section-gap py-section-gap gap-block-gap mx-auto flex w-full max-w-280 flex-col">
      <header>
        <p className="font-label-heading text-orange-10">개념노트 쓰기</p>
        <h1 className="font-headline1-heading text-gray-12">내 말로 다시 적어봐요</h1>
      </header>
      <EditShell>
        <section className="border-line-line1 rounded-card p-card-pad gap-content-gap flex min-h-96 flex-col border bg-white">
          <label htmlFor="note-handwriting" className="font-body1-heading text-gray-12">필기 판</label>
          <textarea id="note-handwriting" value={text} onChange={(event) => setText(event.target.value)} className="border-line-line2 rounded-input font-body1-normal min-h-72 w-full resize-none border p-card-pad" placeholder="풀이와 개념을 내 말로 적어보세요" />
          <div className="flex items-center justify-between">
            <p className="font-body2-normal text-gray-9">
              {draftSaved ? '저장하지 못해 이 기기에 초안을 남겼어요.' : savedVersion ? `판 ${savedVersion} 저장됨` : '저장하면 새 판이 쌓여요.'}
            </p>
            <Button disabled={!text.trim()} isLoading={save.isPending} onClick={() => save.mutate()}>새 판 저장</Button>
          </div>
        </section>
      </EditShell>
      <ReferenceDrawer pageId={pageId} />
    </main>
  );
};
