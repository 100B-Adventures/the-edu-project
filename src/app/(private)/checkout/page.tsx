import { Suspense } from 'react';

import { notFound } from 'next/navigation';

import { CheckoutPage } from '@/features/mvp-h-slice3/components/checkout-pages';
import { isMvpHShellEnabled } from '@/shared/lib/mvp-h-slice';

export default function CheckoutRoute() {
  if (!isMvpHShellEnabled()) notFound();
  return (
    <Suspense fallback={null}>
      <CheckoutPage />
    </Suspense>
  );
}
