'use client';

import { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';

import { useTeacherDashboardStudyRoomListQuery } from '@/features/dashboard/hooks/use-teacher-dashboard-query';
import { useInvitationQuery } from '@/features/study-rooms/hooks/use-invitation-query';
import { useToggleInvitation } from '@/features/study-rooms/hooks/use-toggle-invitation';
import { PageLayout } from '@/layout';
import { Button, Card } from '@/shared/components/ui';
import { showBottomToast } from '@/shared/components/ui/bottom-toast';
import { Button as UnstyledButton } from '@/shared/components/ui/button';
import { PRIVATE } from '@/shared/constants';

/**
 * 승인 디자인 v22 `tMyOk` 3706~3709 `학생 초대 코드` 카드 + `코드 복사`·`링크로 보내기`.
 *
 * v22 는 선생님 1인당 코드 한 개를 그리지만, 서버의 초대 계약은 스터디룸마다
 * 초대 링크를 발행하는 구조다(`GET/PUT /api/teacher/study-rooms/{id}/invitation`).
 * 학생이 실제로 들어오는 경로(`/invite?token=...`)도 그 계약 위에 이미 서 있다.
 * 그래서 코드는 수업을 고른 뒤 그 수업의 초대 토큰으로 발행한다.
 * 두 버튼은 모두 진짜 동작한다: 복사는 클립보드, 보내기는 공유 시트(없으면 클립보드).
 */
const TeacherInviteCodeCard = () => {
  const rooms = useTeacherDashboardStudyRoomListQuery();
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const roomList = useMemo(() => rooms.data ?? [], [rooms.data]);
  const activeRoomId = selectedRoomId ?? roomList[0]?.id ?? null;

  useEffect(() => {
    const firstRoom = roomList[0];
    if (selectedRoomId === null && firstRoom) {
      setSelectedRoomId(firstRoom.id);
    }
  }, [roomList, selectedRoomId]);

  const invitation = useInvitationQuery(activeRoomId ?? 0, {
    enabled: activeRoomId !== null,
  });
  const toggleInvitation = useToggleInvitation(activeRoomId ?? 0);

  const token = invitation.data?.enabled ? invitation.data.token : null;
  const inviteLink = token
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/invite?token=${token}`
    : null;

  const copyCode = async () => {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    showBottomToast('초대 코드를 복사했어요. 학생에게 전달해 주세요');
  };

  const shareLink = async () => {
    if (!inviteLink) return;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: '디에듀 학생 초대', url: inviteLink });
        return;
      } catch {
        // 공유 시트를 닫은 경우까지 오류로 다루지 않고 복사로 넘어간다.
      }
    }
    await navigator.clipboard.writeText(inviteLink);
    showBottomToast('초대 링크를 복사했어요. 메시지로 보내면 됩니다');
  };

  return (
    <Card data-testid="teacher-invite-code-card">
      <div className="mb-block-gap">
        <h2 className="font-body2-heading">학생 초대 코드</h2>
        <p className="text-gray-8 font-caption-normal">
          학생이 이 코드를 넣으면 고른 수업에 바로 들어옵니다
        </p>
      </div>

      {roomList.length > 1 && (
        <label className="text-gray-8 font-caption-heading mb-block-gap block">
          코드를 발행할 수업
          <select
            value={activeRoomId ?? ''}
            onChange={(event) => setSelectedRoomId(Number(event.target.value))}
            data-testid="teacher-invite-code-room"
            className="border-gray-3 text-gray-12 mt-inline-gap-xs min-h-control-sm rounded-input px-button-compact-x w-full border text-sm font-bold"
          >
            {roomList.map((room) => (
              <option
                key={room.id}
                value={room.id}
              >
                {room.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {roomList.length === 0 ? (
        <>
          <div className="border-orange-4 text-orange-11 rounded-row p-card-pad border border-dashed text-center text-xs font-bold">
            수업이 아직 없어서 코드를 만들 수 없습니다
          </div>
          <Link
            href={PRIVATE.DASHBOARD.TEACHER}
            className="border-gray-3 min-h-control-sm rounded-button px-button-compact-x mt-block-gap flex items-center justify-center border text-center text-xs font-bold"
          >
            수업 만들러 가기
          </Link>
        </>
      ) : (
        <>
          <div
            className="border-orange-4 text-orange-11 rounded-row p-card-pad border border-dashed text-center text-sm font-extrabold tracking-widest break-all"
            data-testid="teacher-invite-code-value"
            data-clarity-mask="true"
          >
            {invitation.isPending
              ? '코드를 불러오는 중입니다'
              : (token ?? '이 수업의 초대 코드가 꺼져 있습니다')}
          </div>
          <div className="mt-block-gap gap-content-gap flex">
            <UnstyledButton
              variant="unstyled"
              size="none"
              type="button"
              onClick={copyCode}
              disabled={!token}
              data-testid="teacher-invite-code-copy"
              className="border-gray-3 min-h-control-sm rounded-button flex-1 cursor-pointer border text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40"
            >
              코드 복사
            </UnstyledButton>
            <UnstyledButton
              variant="unstyled"
              size="none"
              type="button"
              onClick={shareLink}
              disabled={!inviteLink}
              data-testid="teacher-invite-code-share"
              className="border-gray-3 min-h-control-sm rounded-button flex-1 cursor-pointer border text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40"
            >
              링크로 보내기
            </UnstyledButton>
          </div>
          <p className="text-gray-8 text-ui-choice mt-content-gap">
            학생은 초대 코드 넣기 화면(/invite)에 이 코드를 붙여넣거나, 보낸
            링크를 눌러 들어옵니다.
          </p>
          {!token && !invitation.isPending && (
            <UnstyledButton
              variant="unstyled"
              size="none"
              type="button"
              onClick={() => toggleInvitation.mutate(true)}
              disabled={toggleInvitation.isPending}
              data-testid="teacher-invite-code-enable"
              className="border-orange-4 text-orange-11 mt-content-gap min-h-control-sm rounded-button w-full cursor-pointer border text-xs font-bold"
            >
              {toggleInvitation.isPending ? '켜는 중' : '초대 코드 켜기'}
            </UnstyledButton>
          )}
        </>
      )}
    </Card>
  );
};

export const TeacherMyPage = ({ memberName }: { memberName: string }) => (
  <div className="bg-system-background min-h-screen w-full">
    <PageLayout
      width="content"
      className="gap-section-gap desktop:grid-cols-2 grid grid-cols-1 items-start"
      data-testid="teacher-my-page"
    >
      <div className="col-span-full">
        <h1 className="text-gray-12 font-headline1-heading">마이페이지</h1>
        <p className="text-gray-9 font-caption-normal mt-inline-gap-xs">
          내 정보와 학생 초대, 알림 설정을 한곳에서 관리합니다.
        </p>
      </div>
      <div className="gap-block-gap grid min-w-0">
        <Card>
          <Card.Header>
            <div>
              <Card.Title>내 정보</Card.Title>
              <Card.Description>
                서버가 확인한 현재 계정 정보만 표시합니다.
              </Card.Description>
            </div>
            <Button
              asChild
              variant="outlined"
              size="xsmall"
            >
              <Link href={`${PRIVATE.MYPAGE}?tab=profile`}>수정</Link>
            </Button>
          </Card.Header>
          <Card.Content>
            <dl className="gap-content-gap flex items-center text-sm">
              <dt className="text-gray-8">이름</dt>
              <dd className="text-gray-12 font-bold">{memberName}</dd>
            </dl>
            <p className="text-gray-8 font-caption-normal mt-card-pad">
              과목과 지도 대상은 현재 교사 기본 정보 계약에 없어 표시하지
              않습니다.
            </p>
          </Card.Content>
        </Card>
        <TeacherInviteCodeCard />
      </div>
      <div className="gap-block-gap grid min-w-0">
        <Card>
          <Card.Header>
            <div>
              <Card.Title>알림 설정</Card.Title>
              <Card.Description>
                받는 알림의 실제 상태는 설정 화면에서 관리합니다.
              </Card.Description>
            </div>
          </Card.Header>
          <Card.Content>
            <Setting
              label="학생이 질문을 남겼을 때"
              detail="질문·답변 알림"
            />
            <Setting
              label="새 수업노트 활동이 생겼을 때"
              detail="수업노트 알림"
            />
            <Setting
              label="학생이 시험을 제출했을 때"
              detail="서비스 알림"
            />
          </Card.Content>
        </Card>
        <Card data-testid="teacher-weekly-usage-empty">
          <Card.Header>
            <div>
              <Card.Title>이번 주 사용 시간</Card.Title>
              <Card.Description>교사 활동 시간 집계</Card.Description>
            </div>
          </Card.Header>
          <Card.Content className="border-gray-3 bg-gray-2 rounded-row p-card-pad border border-dashed text-center">
            <b className="text-gray-12 block text-sm">
              사용 시간 집계가 아직 연결되지 않았습니다
            </b>
            <p className="text-gray-8 font-caption-normal mt-content-gap">
              현재 교사 응답에는 사용 시간 필드가 없어 숫자를 만들지 않습니다.
            </p>
          </Card.Content>
        </Card>
      </div>
    </PageLayout>
  </div>
);

const Setting = ({ label, detail }: { label: string; detail: string }) => (
  <div className="border-gray-2 min-h-row-min gap-content-gap flex items-center border-t py-3 first:border-t-0">
    <div>
      <b className="block text-sm">{label}</b>
      <small className="text-gray-8">{detail}</small>
    </div>
    <Link
      href={PRIVATE.SETTINGS}
      className="border-gray-3 text-gray-11 min-h-control-sm rounded-button px-button-compact-x ml-auto inline-flex items-center border text-xs font-bold"
      aria-label={`${label} 알림 설정 열기`}
    >
      설정 열기
    </Link>
  </div>
);
