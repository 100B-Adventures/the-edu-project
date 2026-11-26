'use client';

import { useState } from 'react';

import { useNoteReferences } from '@/features/unit-note/hooks/use-note-collaboration';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

const MEDIA_DOCUMENT = /\.(pdf|mp4|webm|mov|docx?|pptx?)(?:[?#].*)?$/i;

export const isAllowedReferenceUrl = (value: string) => {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(
        url.hostname
      ) || MEDIA_DOCUMENT.test(url.pathname))
    );
  } catch {
    return false;
  }
};

export const ReferenceDrawer = ({ pageId }: { pageId: number }) => {
  const references = useNoteReferences(pageId);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const valid = isAllowedReferenceUrl(url);

  return (
    <section className="border-line-line1 rounded-card p-card-pad gap-content-gap flex flex-col border bg-white" aria-label="참고자료 서랍">
      <h2 className="font-body1-heading text-gray-12">참고자료</h2>
      <div className="gap-inline-gap grid shell:grid-cols-[1fr_2fr_auto]">
        <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="자료 이름" aria-label="자료 이름" />
        <Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https 영상·문서 링크" aria-label="자료 링크" aria-invalid={url.length > 0 && !valid} />
        <Button disabled={!title.trim() || !valid || references.add.isPending} onClick={() => references.add.mutate({ kind: 'URL', title: title.trim(), url }, { onSuccess: () => { setTitle(''); setUrl(''); } })}>
          붙이기
        </Button>
      </div>
      {url.length > 0 && !valid && <p className="font-caption-normal text-system-warning">https 영상 또는 문서 파일 링크만 저장할 수 있어요.</p>}
      <ul className="gap-inline-gap grid shell:grid-cols-3">
        {(references.query.data ?? []).map((reference) => (
          <li key={reference.id} className="bg-gray-1 rounded-control-compact p-content-gap">
            <b className="font-body2-heading text-gray-12">{reference.title}</b>
            <Button size="compact" variant="ghost" onClick={() => references.remove.mutate(reference.id)}>빼기</Button>
          </li>
        ))}
      </ul>
    </section>
  );
};
