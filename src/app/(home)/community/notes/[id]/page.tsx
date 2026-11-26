import { notFound } from 'next/navigation';

import { SHELL_CAPABILITIES } from '@/features/app-shell/model/shell-capabilities';
import { PublicNotePage } from '@/features/mvp-h-slice3/components/community-pages';
import { isMvpHShellEnabled } from '@/shared/lib/mvp-h-slice';

export default async function PublicNoteRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = Number((await params).id);
  if (
    !isMvpHShellEnabled() ||
    !SHELL_CAPABILITIES.bestNotes ||
    !Number.isSafeInteger(id)
  )
    notFound();
  return <PublicNotePage id={id} />;
}
