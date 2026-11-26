import { Suspense } from 'react';

import { notFound } from 'next/navigation';

import { PayDonePage } from '@/features/mvp-h-slice3/components/checkout-pages';
import { isMvpHShellEnabled } from '@/shared/lib/mvp-h-slice';

export default function PayDoneRoute() {
  if (!isMvpHShellEnabled()) notFound();
  return (
    <Suspense fallback={null}>
      <PayDonePage />
    </Suspense>
  );
}
