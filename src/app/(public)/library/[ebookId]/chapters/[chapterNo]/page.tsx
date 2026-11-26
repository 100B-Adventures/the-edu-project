import { notFound } from 'next/navigation';

import { SHELL_CAPABILITIES } from '@/features/app-shell/model/shell-capabilities';
import { EbookChapterPage } from '@/features/mvp-h-slice3/components/library-program-pages';
import { isMvpHShellEnabled } from '@/shared/lib/mvp-h-slice';

export default async function EbookChapterRoute({
  params,
}: {
  params: Promise<{ ebookId: string; chapterNo: string }>;
}) {
  const values = await params;
  const ebookId = Number(values.ebookId);
  const chapterNo = Number(values.chapterNo);
  if (
    !isMvpHShellEnabled() ||
    !SHELL_CAPABILITIES.ebookLibrary ||
    !Number.isSafeInteger(ebookId) ||
    !Number.isSafeInteger(chapterNo)
  ) {
    notFound();
  }
  return (
    <EbookChapterPage
      ebookId={ebookId}
      chapterNo={chapterNo}
    />
  );
}
