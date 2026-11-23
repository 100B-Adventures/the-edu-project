import { BlankRetry } from '@/features/review/components/blank-retry';

type PageProps = { params: Promise<{ wrongAnswerId: string }> };

export default async function BlankRetryPage({ params }: PageProps) {
  const { wrongAnswerId } = await params;
  return <BlankRetry wrongAnswerId={Number(wrongAnswerId)} />;
}
