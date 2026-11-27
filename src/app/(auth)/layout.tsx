import { redirect } from 'next/navigation';

import { resolveRoleDestination } from '@/features/auth/lib/redirect';
import AuthBanner from '@/shared/components/auth/banner';
import { isMvpHShellEnabled } from '@/shared/lib/mvp-h-slice';
import { fetchMemberRole } from '@/shared/lib/server';

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await fetchMemberRole();

  if (session.status === 'authenticated') {
    if (session.role === 'ROLE_MEMBER') redirect('/select-role');
    else
      redirect(resolveRoleDestination(session.role, isMvpHShellEnabled()));
  }

  return (
    <>
      <AuthBanner />
      {children}
    </>
  );
}
