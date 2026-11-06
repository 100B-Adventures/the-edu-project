'use client';

import { useEffect, useRef, useState } from 'react';

import Link from 'next/link';

import {
  type TeacherInviteIssue,
  teacherInviteRepository,
} from '@/entities/teacher-invite';
import { useStudentDashboardStudyRoomListQuery } from '@/features/dashboard/hooks/use-student-dashboard-query';
import { Button, Card } from '@/shared/components/ui';
import { PRIVATE } from '@/shared/constants/route';
import {
  trackTeacherInviteBannerImpression,
  trackTeacherInviteIssueSuccess,
  trackTeacherInviteSnooze,
} from '@/shared/lib/analytics';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const StudentTeacherInviteCard = ({
  compact = false,
}: {
  compact?: boolean;
}) => {
  const queryClient = useQueryClient();
  const rooms = useStudentDashboardStudyRoomListQuery({ enabled: !compact });
  const [invite, setInvite] = useState<TeacherInviteIssue | null>(null);
  const [hidden, setHidden] = useState(false);
  const impressionTracked = useRef(false);
  const state = useQuery({
    queryKey: ['teacher-invite-state'],
    queryFn: teacherInviteRepository.state,
  });
  const issue = useMutation({
    mutationFn: teacherInviteRepository.issue,
    onSuccess: (issued) => {
      setInvite(issued);
      trackTeacherInviteIssueSuccess(compact ? 'student_home' : 'connections');
    },
  });
  const revoke = useMutation({
    mutationFn: teacherInviteRepository.revoke,
    onSuccess: () => setInvite(null),
  });
  const snooze = useMutation({
    mutationFn: teacherInviteRepository.snooze,
    onSuccess: async (_response, mode) => {
      setHidden(true);
      trackTeacherInviteSnooze(mode);
      await queryClient.invalidateQueries({
        queryKey: ['teacher-invite-state'],
      });
    },
  });

  const isCompactVisible =
    compact &&
    state.isSuccess &&
    !state.isFetching &&
    state.data.mode === 'VISIBLE';

  useEffect(() => {
    if (!isCompactVisible || impressionTracked.current) return;
    impressionTracked.current = true;
    trackTeacherInviteBannerImpression();
  }, [isCompactVisible]);

  if (compact && (hidden || !isCompactVisible)) return null;

  if (!compact && (state.isPending || state.isFetching)) {
    return (
      <Card data-testid="student-teacher-invite-loading">
        <p className="text-gray-8 text-xs">
          선생님 연결 상태를 확인하는 중입니다.
        </p>
      </Card>
    );
  }

  if (!compact && state.data?.mode === 'CONNECTED') {
    const primaryRoom = rooms.data?.[0];
    return (
      <Card data-testid="student-teacher-invite-connected">
        <h2 className="text-gray-12 text-base font-extrabold">선생님 연결</h2>
        <p className="text-gray-9 mt-2 text-xs leading-6">
          이미 선생님과 연결되어 있어요. 연결된 수업으로 바로 이동할 수 있어요.
        </p>
        {primaryRoom && (
          <Link
            className="text-orange-11 mt-3 inline-block text-sm font-bold"
            href={PRIVATE.ROOM.DETAIL(primaryRoom.id)}
          >
            {primaryRoom.name} 열기
          </Link>
        )}
      </Card>
    );
  }

  return (
    <Card data-testid="student-teacher-invite-card">
      <h2 className="text-gray-12 text-base font-extrabold">선생님 연결</h2>
      <p className="text-gray-9 mt-2 text-xs leading-6">
        선생님이 연결되면 틀린 문제에 코멘트가 붙고 오늘 할 일을 함께 관리할 수
        있어요. 링크는 14일 동안 한 번만 사용할 수 있습니다.
      </p>
      {invite ? (
        <div className="border-orange-4 bg-orange-1 mt-3 rounded-lg border p-3">
          <p
            data-clarity-mask="true"
            className="text-gray-12 text-xs font-bold break-all"
            data-testid="teacher-invite-url"
          >
            {invite.inviteUrl}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="small"
              onClick={() => navigator.clipboard.writeText(invite.inviteUrl)}
            >
              링크 복사
            </Button>
            <Button
              size="small"
              variant="outlined"
              disabled={revoke.isPending}
              onClick={() => revoke.mutate()}
            >
              링크 폐기
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="small"
          className="mt-3"
          isLoading={issue.isPending}
          loadingText="링크 만드는 중"
          onClick={() => issue.mutate()}
        >
          초대 링크 만들기
        </Button>
      )}
      {issue.isError && (
        <p
          className="text-system-warning-text mt-2 text-xs"
          role="alert"
        >
          초대 링크를 만들지 못했습니다. 잠시 뒤 다시 시도해주세요.
        </p>
      )}
      {compact && !invite && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Button
            type="button"
            variant="unstyled"
            size="none"
            onClick={() => snooze.mutate('THREE_DAYS')}
          >
            3일 뒤에
          </Button>
          <Button
            type="button"
            variant="unstyled"
            size="none"
            onClick={() => snooze.mutate('SEVEN_DAYS')}
          >
            7일 뒤에
          </Button>
          <Button
            type="button"
            variant="unstyled"
            size="none"
            onClick={() => snooze.mutate('FOREVER')}
          >
            괜찮아요
          </Button>
        </div>
      )}
    </Card>
  );
};
