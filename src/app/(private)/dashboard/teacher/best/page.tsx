import { notFound } from 'next/navigation';

import { SHELL_CAPABILITIES } from '@/features/app-shell/model/shell-capabilities';
import { BestNotesPage } from '@/features/mvp-h-slice3/components/community-pages';
import { isMvpHShellEnabled } from '@/shared/lib/mvp-h-slice';

export default function BestNotesRoute() {
  if (!isMvpHShellEnabled() || !SHELL_CAPABILITIES.bestNotes) notFound();
  return <BestNotesPage />;
}
