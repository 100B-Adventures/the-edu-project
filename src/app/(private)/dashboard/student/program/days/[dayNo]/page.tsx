import { notFound } from 'next/navigation';

import { SHELL_CAPABILITIES } from '@/features/app-shell/model/shell-capabilities';
import { ProgramDayPage } from '@/features/mvp-h-slice3/components/library-program-pages';
import { isMvpHShellEnabled } from '@/shared/lib/mvp-h-slice';

export default async function ProgramDayRoute({
  params,
}: {
  params: Promise<{ dayNo: string }>;
}) {
  const dayNo = Number((await params).dayNo);
  if (
    !isMvpHShellEnabled() ||
    !SHELL_CAPABILITIES.program ||
    !Number.isInteger(dayNo) ||
    dayNo < 1 ||
    dayNo > 58
  )
    notFound();
  return <ProgramDayPage dayNo={dayNo} />;
}
