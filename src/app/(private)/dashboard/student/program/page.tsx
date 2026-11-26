import { notFound } from 'next/navigation';

import { SHELL_CAPABILITIES } from '@/features/app-shell/model/shell-capabilities';
import { ProgramPathPage } from '@/features/mvp-h-slice3/components/library-program-pages';
import { isMvpHShellEnabled } from '@/shared/lib/mvp-h-slice';

export default function ProgramRoute() {
  if (!isMvpHShellEnabled() || !SHELL_CAPABILITIES.program) notFound();
  return <ProgramPathPage />;
}
