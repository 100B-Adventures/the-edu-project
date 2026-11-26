import { notFound } from 'next/navigation';

import { SHELL_CAPABILITIES } from '@/features/app-shell/model/shell-capabilities';
import { EbookLibraryPage } from '@/features/mvp-h-slice3/components/library-program-pages';
import { isMvpHShellEnabled } from '@/shared/lib/mvp-h-slice';

export default function LibraryRoute() {
  if (!isMvpHShellEnabled() || !SHELL_CAPABILITIES.ebookLibrary) notFound();
  return <EbookLibraryPage />;
}
