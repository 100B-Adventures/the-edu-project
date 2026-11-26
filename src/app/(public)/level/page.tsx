import { notFound } from 'next/navigation';

import { SHELL_CAPABILITIES } from '@/features/app-shell/model/shell-capabilities';
import { LevelTestPage } from '@/features/mvp-h-slice3/components/level-test-page';
import { isMvpHShellEnabled } from '@/shared/lib/mvp-h-slice';

export default function LevelPage() {
  if (!isMvpHShellEnabled() || !SHELL_CAPABILITIES.levelTest) notFound();
  return <LevelTestPage />;
}
