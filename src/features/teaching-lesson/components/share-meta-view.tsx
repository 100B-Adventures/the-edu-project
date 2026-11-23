'use client';

import { useQuery } from '@tanstack/react-query';

import { teachingNoteKeys, teachingNoteRepository } from '@/entities/teaching-note';
import { Skeleton } from '@/shared/components/loading';
import { EmptyState } from '@/shared/components/ui';

type Props = { token: string };

/** 공개 공유 링크 첫 화면(api-contract §1.15). 로그인 없이 수업 요약만 보인다. */
export const ShareMetaView = ({ token }: Props) => {
  const query = useQuery({
    queryKey: teachingNoteKeys.shareMeta(token),
    queryFn: () => teachingNoteRepository.getShareMeta(token),
    retry: false,
  });
  if (query.isPending) return <Skeleton.Block className="h-40 w-full" />;
  if (query.isError || !query.data) {
    return <EmptyState title="열 수 없는 링크예요" />;
  }
  const meta = query.data;
  return (
    <main className="mx-auto flex w-full max-w-content-max flex-col gap-3 p-card-pad">
      <h1 className="font-headline1-heading text-text-main">
        {meta.title ?? '수업노트'}
      </h1>
      <p className="font-body2-normal text-text-sub1">
        {[meta.studyRoomName, meta.teacherName].filter(Boolean).join(' · ')}
      </p>
      <p className="font-body1-normal text-text-main">
        같이 푼 문제 {meta.problemCount} · 판서 사진 {meta.boardPhotoCount} · 과제{' '}
        {meta.homeworkCount}
      </p>
    </main>
  );
};
