import { notFound } from 'next/navigation';

import { SHELL_CAPABILITIES } from '@/features/app-shell/model/shell-capabilities';
import { DeclarationPage } from '@/features/mvp-h-slice3/components/community-pages';
import { isMvpHShellEnabled } from '@/shared/lib/mvp-h-slice';

export default function DeclarationRoute() {
  if (!isMvpHShellEnabled() || !SHELL_CAPABILITIES.declarations) notFound();
  return <DeclarationPage />;
}
