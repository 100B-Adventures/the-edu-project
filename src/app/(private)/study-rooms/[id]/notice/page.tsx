import { notFound } from 'next/navigation';

import { NoticePage } from '@/features/study-rooms/components/office/notice-page';
import { isMvpHShellEnabled } from '@/shared/lib/mvp-h-slice';

type PageProps = { params: Promise<{ id: string }> };

/** 교무실 공지 탭. shell 스위치가 꺼져 있으면 열지 않는다(새 주소). */
export default async function StudyRoomNoticeRoute({ params }: PageProps) {
  if (!isMvpHShellEnabled()) notFound();
  const { id } = await params;
  const roomId = Number(id);
  if (!Number.isInteger(roomId) || roomId <= 0) notFound();
  return <NoticePage roomId={roomId} />;
}
