'use client';

import Link from 'next/link';

import {
  teachingNoteKeys,
  teachingNoteRepository,
} from '@/entities/teaching-note';
import { Skeleton } from '@/shared/components/loading';
import { Button, EmptyState } from '@/shared/components/ui';
import { PUBLIC } from '@/shared/constants';
import { useQuery } from '@tanstack/react-query';

type Props = { token: string };

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** "2026-11-24T10:00:00" -> "2026.11.24 (화)". 시간대 변환 없이 날짜 부분만 읽는다. */
export const formatLessonDate = (iso: string | null | undefined) => {
  const matched = iso?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!matched) return null;
  const [, year, month, day] = matched;
  const weekday =
    WEEKDAYS[
      new Date(
        Date.UTC(Number(year), Number(month) - 1, Number(day))
      ).getUTCDay()
    ];
  return `${year}.${month}.${day} (${weekday})`;
};

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
  const lessonDate = formatLessonDate(meta.taughtAt);
  const loginHref = `${PUBLIC.CORE.LOGIN}?redirect=${encodeURIComponent(`/s/${token}`)}`;
  return (
    <main className="max-w-content-max p-card-pad mx-auto flex w-full flex-col gap-3">
      {lessonDate && (
        <p
          className="font-body2-heading text-orange-10"
          data-testid="share-lesson-date"
        >
          {lessonDate} 수업
        </p>
      )}
      <h1 className="font-headline1-heading text-text-main">
        {meta.title ?? '수업노트'}
      </h1>
      <p className="font-body2-normal text-text-sub1">
        {[meta.studyRoomName, meta.teacherName].filter(Boolean).join(' · ')}
      </p>
      <p className="font-body1-normal text-text-main">
        같이 푼 문제 {meta.problemCount} · 판서 사진 {meta.boardPhotoCount} ·
        과제 {meta.homeworkCount}
      </p>
      <div
        className="border-line-line2 rounded-card flex flex-col gap-2 border p-4"
        data-testid="share-login-prompt"
      >
        <p className="font-body1-normal text-text-main">
          로그인하면 수업노트 전체를 볼 수 있어요
        </p>
        <Button
          asChild
          size="large"
        >
          <Link href={loginHref}>로그인</Link>
        </Button>
      </div>
    </main>
  );
};
