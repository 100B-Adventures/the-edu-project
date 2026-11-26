import { notFound } from 'next/navigation';

import { NoteWritePage } from '@/features/unit-note/components/note-write/note-write-page';
import { isMvpHShellEnabled } from '@/shared/lib/mvp-h-slice';

type PageProps = {
  params: Promise<{ nodeId: string }>;
  searchParams: Promise<{ pageId?: string }>;
};

export default async function UnitNoteWriteRoute({ params, searchParams }: PageProps) {
  if (!isMvpHShellEnabled()) notFound();
  const [{ nodeId }, { pageId }] = await Promise.all([params, searchParams]);
  const parsedNodeId = Number(nodeId);
  const parsedPageId = Number(pageId);
  if (!Number.isInteger(parsedNodeId) || !Number.isInteger(parsedPageId) || parsedNodeId <= 0 || parsedPageId <= 0) notFound();
  return <NoteWritePage nodeId={parsedNodeId} pageId={parsedPageId} />;
}
