'use client';

import { useEffect } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  teachingNoteKeys,
  teachingNoteRepository,
} from '@/entities/teaching-note';
import { Skeleton } from '@/shared/components/loading';
import { Button, EmptyState } from '@/shared/components/ui';
import { PRIVATE, PUBLIC } from '@/shared/constants';
import { useRole } from '@/shared/hooks/use-role';
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
  const router = useRouter();
  // 로그인한 사람이면 같은 링크를 해석해 그 방 구성원이면 전체 수업노트로 보낸다(교차 리뷰 P1-10).
  const { role, isLoading: isRoleLoading } = useRole();
  const isLoggedIn = !!role;
  const resolve = useQuery({
    queryKey: teachingNoteKeys.shareResolve(token),
    queryFn: () => teachingNoteRepository.resolveShare(token),
    enabled: isLoggedIn,
    retry: false,
  });
  useEffect(() => {
    if (resolve.data) {
      router.replace(
        PRIVATE.NOTE.DETAIL(
          resolve.data.studyRoomId,
          resolve.data.teachingNoteId
        )
      );
    }
  }, [resolve.data, router]);

  if (query.isPending || isRoleLoading || (isLoggedIn && resolve.isPending)) {
    return <Skeleton.Block className="h-40 w-full" />;
  }
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
      <p className="font-body2-normal text-text-sub1">{meta.teacherName}</p>
      <p className="font-body1-normal text-text-main">
        같이 푼 문제 {meta.problemCount} · 판서 사진 {meta.boardPhotoCount} ·
        과제 {meta.homeworkCount}
      </p>
      {isLoggedIn ? (
        <div
          className="border-line-line2 rounded-card flex flex-col gap-2 border p-4"
          data-testid="share-not-member"
        >
          <p className="font-body1-normal text-text-main">
            이 수업노트의 스터디룸 구성원이 아니라서 전체를 볼 수 없어요
          </p>
        </div>
      ) : (
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
      )}
    </main>
  );
};
