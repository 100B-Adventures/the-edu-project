import { SolutionNoteView } from '@/features/solution-note/components/solution-note-view';

type PageProps = { params: Promise<{ id: string }> };

export default async function SolutionNotePage({ params }: PageProps) {
  const { id } = await params;
  return <SolutionNoteView solutionNoteId={Number(id)} />;
}
