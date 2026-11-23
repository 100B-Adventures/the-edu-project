import { ShareMetaView } from '@/features/teaching-lesson/components/share-meta-view';

type PageProps = { params: Promise<{ token: string }> };

export default async function TeachingNoteSharePage({ params }: PageProps) {
  const { token } = await params;
  return <ShareMetaView token={token} />;
}
