'use client';

import { openChallengeKeys } from '@/entities/open-challenge';
import { repository as openChallengeRepository } from '@/entities/open-challenge';
import { Skeleton } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui';
import { useQuery } from '@tanstack/react-query';

type TodaySolvedPickerProps = {
  enabled: boolean;
  onPick: (attemptId: number) => void;
};

const isToday = (iso: string | null) => {
  if (!iso) return false;
  const solved = new Date(iso);
  const now = new Date();
  return (
    solved.getFullYear() === now.getFullYear() &&
    solved.getMonth() === now.getMonth() &&
    solved.getDate() === now.getDate()
  );
};

/** 오늘 완료한 오픈챌린지 제출 목록. 고르면 그 제출의 마지막 완료 시도(attemptId)로 가져온다. */
export const TodaySolvedPicker = ({ enabled, onPick }: TodaySolvedPickerProps) => {
  const listQuery = useQuery({
    queryKey: [...openChallengeKeys.all, 'review-today-solved'],
    queryFn: () =>
      openChallengeRepository.getMyList({ status: 'COMPLETED', size: 30 }),
    enabled,
  });

  const handlePick = async (challengeId: string) => {
    const detail = await openChallengeRepository.getMyDetail(challengeId);
    const completed = detail.attempts.filter(
      (attempt) => attempt.status === 'COMPLETED'
    );
    const last = completed[completed.length - 1];
    if (last) onPick(Number(last.attemptId));
  };

  if (listQuery.isPending) {
    return <Skeleton.Block className="h-24 w-full" />;
  }
  const items = (listQuery.data?.content ?? []).filter((item) =>
    isToday(item.completedAt)
  );
  if (items.length === 0) {
    return <p className="font-body2-normal text-text-sub1">오늘 푼 문제가 없어요.</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.challengeId}>
          <Button
            variant="outlined"
            className="w-full justify-start"
            onClick={() => void handlePick(String(item.challengeId))}
          >
            <span className="truncate">{item.questionText}</span>
          </Button>
        </li>
      ))}
    </ul>
  );
};
