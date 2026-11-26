'use client';

import { type FC, useState } from 'react';

import Link from 'next/link';

import { useUpdateStudyRoomTitle } from '@/features/study-rooms/components/sidebar/services/query';
import { useTeacherStudyRoomDetailQuery } from '@/features/study-rooms/hooks';
import { PageLayout } from '@/layout';
import { Button as UnstyledButton } from '@/shared/components/ui/button';
import { PRIVATE } from '@/shared/constants';
import { cn } from '@/shared/lib';
import { RefreshCw } from 'lucide-react';

import { useChangeStudyRoomStatus } from '../../hooks/use-change-study-room-status';
import { useTeacherDashboardStudyRoomListQuery } from '../../hooks/use-teacher-dashboard-query';

/**
 * 승인 디자인 v22 `roomCard` 3324 `스터디룸 이름 수정`.
 * 이름 변경 API 는 스터디룸 전체를 다시 보내는 PUT 이라, 열릴 때 상세를 먼저 읽고 이름만 바꿔 보낸다.
 */
const RoomRenameDialog = ({
  studyRoomId,
  currentName,
  onClose,
}: {
  studyRoomId: number;
  currentName: string;
  onClose: () => void;
}) => {
  const [name, setName] = useState(currentName);
  const detailQuery = useTeacherStudyRoomDetailQuery(studyRoomId, {
    enabled: true,
  });
  const rename = useUpdateStudyRoomTitle();
  const detail = detailQuery.data;

  return (
    <div className="bg-system-dim p-section-gap fixed inset-0 z-50 flex items-center justify-center">
      <form
        className="p-card-pad rounded-card w-full max-w-sm bg-white"
        data-testid="study-room-rename-dialog"
        onSubmit={(event) => {
          event.preventDefault();
          const trimmed = name.trim();
          if (!trimmed || !detail) return;
          rename.mutate(
            { studyRoomId, name: trimmed, others: detail },
            { onSuccess: onClose }
          );
        }}
      >
        <h3 className="text-sm font-extrabold">스터디룸 이름 수정</h3>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={40}
          autoFocus
          aria-label="스터디룸 이름"
          className="border-gray-3 min-h-control-sm rounded-input mt-3 w-full border px-3 text-sm"
        />
        {!detail && (
          <p className="text-gray-8 text-ui-choice mt-2">
            수업 정보를 불러오는 중입니다.
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <UnstyledButton
            variant="unstyled"
            size="none"
            type="button"
            onClick={onClose}
            className="border-gray-3 min-h-control-sm rounded-button px-button-compact-x border text-xs font-bold"
          >
            취소
          </UnstyledButton>
          <UnstyledButton
            variant="unstyled"
            size="none"
            type="submit"
            disabled={!detail || rename.isPending || name.trim().length === 0}
            className="bg-orange-9 border-orange-10 text-gray-white min-h-control-sm rounded-button px-button-compact-x border text-xs font-bold disabled:opacity-50"
          >
            저장
          </UnstyledButton>
        </div>
      </form>
    </div>
  );
};

// 시안 v23 `.filters`(HTML:427-433): 정렬 칩 2개(손볼것순/최근접속순) + 검색.
type RoomSortKey = 'TODO' | 'RECENT';

const KOREAN_ROOM_COUNT: Record<number, string> = {
  1: '한',
  2: '두',
  3: '세',
  4: '네',
};

const formatRoomCount = (count: number) =>
  KOREAN_ROOM_COUNT[count] ?? `${count}개`;

const DashboardTeacher: FC<{ initialMemberName?: string }> = () => {
  const {
    data: studyRooms = [],
    isPending,
    isError,
    refetch,
  } = useTeacherDashboardStudyRoomListQuery();
  const [sortKey, setSortKey] = useState<RoomSortKey>('TODO');
  const [searchQuery, setSearchQuery] = useState('');
  const rooms = [...studyRooms].sort((a, b) => {
    // "최근 접속 순"은 학생 마지막 접속 데이터가 아직 없어(⛔ 데이터 없음, 항목20과 동일
    // 필드 부재) 손볼 것 순 정렬로 폴백한다. 칩은 눌리지만 결과가 같다. exit_report 명시.
    if (sortKey === 'RECENT') return b.todoCount - a.todoCount;
    return b.todoCount - a.todoCount;
  });
  const searchedRooms = searchQuery.trim()
    ? rooms.filter((room) =>
        `${room.studentName ?? ''} ${room.name}`
          .toLowerCase()
          .includes(searchQuery.trim().toLowerCase())
      )
    : rooms;
  const activeRooms = searchedRooms.filter(
    (room) => room.enrollmentStatus !== 'CLOSED'
  );
  const closedRooms = searchedRooms.filter(
    (room, index, all) =>
      room.enrollmentStatus === 'CLOSED' &&
      all.findIndex((candidate) => candidate.id === room.id) === index
  );
  // 문구의 "위 N 수업"은 바로 아래 보이는 카드 분모다. todoCount가 0인
  // 정상 수업도 카드로 보이므로 손볼 것 유무로 세면 카드 1개를 0개라 말한다.
  const visibleRoomCount = activeRooms.length;
  const [openMenuRoomId, setOpenMenuRoomId] = useState<number | null>(null);
  const [showClosedRooms, setShowClosedRooms] = useState(false);
  // 승인 디자인 v22 `roomCard` 3324 `스터디룸 이름 수정`
  const [renamingRoomId, setRenamingRoomId] = useState<number | null>(null);
  const statusMutation = useChangeStudyRoomStatus();

  const changeRoomStatus = (
    studyRoomId: number,
    status: 'OPERATING' | 'CLOSED'
  ) => {
    statusMutation.mutate(
      { studyRoomId, status },
      { onSuccess: () => setOpenMenuRoomId(null) }
    );
  };

  return (
    <div className="bg-system-background min-h-screen w-full">
      <PageLayout className="gap-block-gap flex flex-col">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-gray-12 font-headline2-heading">내 수업</h2>
          {/* 시안 v23 `.titlerow .mini`(HTML:442-443): 빈 상태에선 "0건" 문구를 숨긴다. */}
          {rooms.length > 0 && (
            <span
              className="text-gray-9 text-xs"
              data-testid="teacher-rooms-summary"
            >
              오늘 <b className="text-gray-12">학생 화면에 넣어줄 것</b>{' '}
              <b className="text-gray-12 tabular-nums">
                {rooms.reduce((sum, room) => sum + room.todoCount, 0)}건
              </b>
              이 위 {formatRoomCount(visibleRoomCount)} 수업에 몰려 있습니다.
            </span>
          )}
          {rooms.length > 0 && (
            <Link
              href="/study-rooms/new"
              className="bg-orange-9 border-orange-10 text-gray-white min-h-control-sm rounded-button px-button-compact-x ml-auto inline-flex items-center border text-xs font-bold"
            >
              스터디룸 만들기
            </Link>
          )}
        </div>
        {rooms.length > 0 && (
          <div
            className="gap-row-gap flex flex-wrap items-center"
            aria-label="수업 목록 정렬·검색"
          >
            <UnstyledButton
              variant="unstyled"
              size="none"
              type="button"
              onClick={() => setSortKey('TODO')}
              aria-pressed={sortKey === 'TODO'}
              className={cn(
                'min-h-control-sm rounded-button px-button-compact-x inline-flex cursor-pointer items-center border text-xs font-bold',
                sortKey === 'TODO'
                  ? 'border-orange-4 bg-orange-1 text-orange-9'
                  : 'border-gray-3 text-gray-10 bg-white'
              )}
            >
              손볼 것 많은 순 {sortKey === 'TODO' && '· 기본'}
            </UnstyledButton>
            <UnstyledButton
              variant="unstyled"
              size="none"
              type="button"
              onClick={() => setSortKey('RECENT')}
              aria-pressed={sortKey === 'RECENT'}
              className={cn(
                'min-h-control-sm rounded-button px-button-compact-x inline-flex cursor-pointer items-center border text-xs font-bold',
                sortKey === 'RECENT'
                  ? 'border-orange-4 bg-orange-1 text-orange-9'
                  : 'border-gray-3 text-gray-10 bg-white'
              )}
            >
              최근 접속 순
            </UnstyledButton>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="학생 이름, 스터디룸 이름으로 검색"
              aria-label="학생 이름, 스터디룸 이름으로 검색"
              className="border-gray-3 min-h-control-sm rounded-button min-w-45 flex-1 border px-3 text-xs"
              data-testid="teacher-rooms-search"
            />
          </div>
        )}
        {isPending ? (
          <div className="border-gray-3 py-empty-pad-y px-empty-pad-x rounded-card border bg-white text-center text-sm">
            수업을 불러오는 중입니다.
          </div>
        ) : isError ? (
          <section
            className="border-system-warning bg-system-warning-alt rounded-card border p-6"
            data-testid="teacher-rooms-error"
          >
            <h2 className="text-system-warning-text font-body1-heading">
              수업 목록을 지금 불러오지 못했어요
            </h2>
            <p className="text-gray-10 mt-2 text-sm leading-relaxed">
              서버 응답이 없습니다. 이미 열려 있던 스터디룸과 기록은 그대로
              있으니, 잠시 뒤 다시 불러오면 손볼 것 목록이 나옵니다.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <UnstyledButton
                variant="unstyled"
                size="none"
                type="button"
                onClick={() => void refetch()}
                className="text-system-warning-text border-system-warning min-h-control-sm rounded-button px-button-compact-x inline-flex cursor-pointer items-center border bg-white text-xs font-bold"
              >
                <RefreshCw
                  size={14}
                  aria-hidden
                  className="mr-1.5 inline"
                />
                다시 불러오기
              </UnstyledButton>
              <Link
                href="/dashboard/teacher/my"
                className="text-system-warning-text border-system-warning min-h-control-sm rounded-button px-button-compact-x inline-flex items-center border bg-white text-xs font-bold"
              >
                마이페이지로 가기
              </Link>
            </div>
          </section>
        ) : rooms.length === 0 ? (
          <section
            className="border-gray-4 py-empty-pad-y px-empty-pad-x rounded-card border border-dashed bg-white text-center"
            data-testid="teacher-rooms-empty"
          >
            <h2 className="text-gray-12 font-body1-heading">
              아직 스터디룸이 하나도 없어요
            </h2>
            <p className="text-gray-9 mt-2 text-sm leading-relaxed">
              학생 한 명당 스터디룸 하나가 기본입니다. 학생이 초대 링크로
              들어오면 그 학생 스터디룸이 자동으로 생기고, 여기에 카드로
              쌓입니다. 먼저 만들어 두고 학생을 부를 수도 있습니다.
            </p>
            <div className="gap-inline-gap mt-5 flex flex-wrap justify-center">
              <Link
                href="/study-rooms/new"
                className="bg-orange-9 border-orange-10 text-gray-white min-h-empty-cta rounded-button px-button-default-x inline-flex items-center border text-sm font-bold"
              >
                첫 스터디룸 만들기
              </Link>
              <Link
                href="/dashboard/teacher/my"
                className="border-gray-3 min-h-empty-cta rounded-button px-button-default-x inline-flex items-center border bg-white text-sm font-bold"
              >
                학생 초대 코드 보기
              </Link>
            </div>
          </section>
        ) : searchedRooms.length === 0 ? (
          <section
            className="border-gray-4 py-empty-pad-y px-empty-pad-x rounded-card border border-dashed bg-white text-center"
            data-testid="teacher-rooms-search-empty"
          >
            <h2 className="text-gray-12 font-body1-heading">
              검색 결과가 없어요
            </h2>
            <p className="text-gray-9 mt-2 text-sm leading-relaxed">
              &apos;{searchQuery.trim()}&apos;와 일치하는 학생 이름이나 스터디룸
              이름이 없습니다. 검색어를 다시 확인해 주세요.
            </p>
          </section>
        ) : (
          <>
            <div
              className="gap-grid-gap grid md:grid-cols-2"
              data-testid="teacher-rooms-list"
            >
              {activeRooms.map((room) => (
                <article
                  key={`${room.id}-${room.studentName ?? 'empty'}`}
                  className="border-gray-3 p-card-pad rounded-card relative flex min-w-0 flex-col border bg-white"
                  data-testid={`teacher-room-card-${room.id}`}
                >
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-gray-12 text-three-lines text-base font-extrabold">
                        {room.studentName ?? room.name}
                      </h3>
                      {/*
                        시안 v23 카드 부제(HTML:402-407)는 "고2·화목 8시·1대1"처럼
                        학년·요일시간을 보여준다. 그 필드(학년/수업 요일시간)가 room
                        스키마에 없어(⛔ 데이터 없음) 있는 필드(스터디룸 이름)만 노출한다.
                      */}
                      <p className="text-gray-9 text-ui-choice mt-1">
                        {room.name}
                      </p>
                    </div>
                    <span className="bg-gray-2 text-gray-10 min-h-badge-min rounded-pill px-button-chip-x text-ui-compact inline-flex items-center font-extrabold">
                      {room.studentName ? '1대1' : '그룹'}
                    </span>
                    <UnstyledButton
                      variant="unstyled"
                      size="none"
                      type="button"
                      aria-label={`${room.studentName ?? room.name} 스터디룸 더 보기`}
                      aria-expanded={openMenuRoomId === room.id}
                      onClick={() =>
                        setOpenMenuRoomId((current) =>
                          current === room.id ? null : room.id
                        )
                      }
                      className="border-gray-3 text-gray-9 hover:bg-gray-1 min-h-touch-min min-w-touch-min rounded-button cursor-pointer border text-sm font-bold"
                    >
                      ···
                    </UnstyledButton>
                  </div>
                  {openMenuRoomId === room.id && (
                    <div className="border-gray-3 shadow-popover top-control-lg right-card-pad rounded-row absolute z-10 w-47 border bg-white p-1">
                      {/* 승인 디자인 v22 `roomCard` 3323~3325: 메뉴 4개 */}
                      <UnstyledButton
                        variant="unstyled"
                        size="none"
                        type="button"
                        onClick={() => {
                          setRenamingRoomId(room.id);
                          setOpenMenuRoomId(null);
                        }}
                        className="hover:bg-gray-1 min-h-touch-min rounded-button block w-full px-3 text-left text-xs font-bold"
                      >
                        스터디룸 이름 수정
                      </UnstyledButton>
                      <Link
                        href={PRIVATE.ROOM.MEMBERS(room.id)}
                        onClick={() => setOpenMenuRoomId(null)}
                        className="hover:bg-gray-1 min-h-touch-min rounded-button flex w-full items-center px-3 text-left text-xs font-bold"
                      >
                        학생 초대
                      </Link>
                      <Link
                        href={PRIVATE.NOTE.CREATE(room.id)}
                        onClick={() => setOpenMenuRoomId(null)}
                        className="hover:bg-gray-1 min-h-touch-min rounded-button flex w-full items-center px-3 text-left text-xs font-bold"
                      >
                        기록 일지 쓰기
                      </Link>
                      <UnstyledButton
                        variant="unstyled"
                        size="none"
                        type="button"
                        disabled={statusMutation.isPending}
                        onClick={() => changeRoomStatus(room.id, 'CLOSED')}
                        className="text-system-warning-text hover:bg-system-warning-alt min-h-touch-min rounded-button block w-full px-3 text-left text-xs font-bold disabled:opacity-50"
                      >
                        이 수업 종료하기
                      </UnstyledButton>
                    </div>
                  )}
                  {renamingRoomId === room.id && (
                    <RoomRenameDialog
                      studyRoomId={room.id}
                      currentName={room.name}
                      onClose={() => setRenamingRoomId(null)}
                    />
                  )}
                  <div
                    className={cn(
                      'p-card-pad rounded-row mt-3 min-w-0 border',
                      room.todoCount > 0
                        ? 'border-orange-3 bg-orange-1'
                        : 'border-gray-3 bg-system-background'
                    )}
                  >
                    <div className="flex items-end gap-2">
                      <b
                        className={cn(
                          'font-headline1-heading tabular-nums',
                          room.todoCount > 0 ? 'text-orange-9' : 'text-gray-7'
                        )}
                      >
                        {room.todoCount}
                      </b>
                      <span className="text-gray-9 text-ui-compact mb-1 font-extrabold">
                        손볼 것
                      </span>
                    </div>
                    <p className="text-gray-11 text-break-safe mt-2 text-xs leading-relaxed font-bold">
                      피드백 달 것 {room.todoBreakdown.commentNeeded} · 할 일
                      승인 {room.todoBreakdown.todoApproval} · 못했어요 사유{' '}
                      {room.todoBreakdown.notDoneReason} · 미확인 제출{' '}
                      {room.todoBreakdown.unreadSubmission}
                    </p>
                  </div>
                  <div className="gap-inline-gap mt-3 flex min-w-0 items-center">
                    <span className="text-gray-9 text-ui-compact text-two-lines min-w-0 flex-1 font-semibold">
                      학생 화면에 넣을 내용을 확인합니다
                    </span>
                    <Link
                      href={
                        room.todoCount > 0
                          ? PRIVATE.ROOM.MANAGE(room.id)
                          : PRIVATE.ROOM.DETAIL(room.id)
                      }
                      className={cn(
                        'min-h-control-sm rounded-button px-button-compact-x inline-flex items-center justify-center border text-xs font-bold',
                        room.todoCount > 0
                          ? 'border-orange-10 bg-orange-9 text-gray-white'
                          : 'border-gray-3 text-gray-11 bg-white'
                      )}
                    >
                      {room.todoCount > 0 ? '학습 관리 열기' : '스터디룸 열기'}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
            {closedRooms.length > 0 && (
              <section
                className="border-gray-3 text-gray-9 p-card-pad rounded-row bg-system-background border text-sm"
                data-testid="teacher-closed-rooms"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span>
                    종료된 스터디룸 <b>{closedRooms.length}개</b>를 접어
                    두었습니다. 방학에 쉬는 학생은 여기서 <b>재개하기</b>로 다시
                    시작합니다.
                  </span>
                  <UnstyledButton
                    variant="unstyled"
                    size="none"
                    type="button"
                    onClick={() => setShowClosedRooms((visible) => !visible)}
                    className="border-gray-3 text-gray-12 min-h-control-sm rounded-button px-button-compact-x ml-auto cursor-pointer border bg-white text-xs font-bold"
                  >
                    {showClosedRooms ? '종료된 것 접기' : '종료된 것 보기'}
                  </UnstyledButton>
                </div>
                {showClosedRooms && (
                  <ul className="mt-3 space-y-2 border-t pt-3">
                    {closedRooms.map((room) => (
                      <li
                        key={room.id}
                        className="bg-gray-1 min-h-row-min rounded-row flex items-center justify-between gap-3 px-3"
                      >
                        <span className="font-bold">
                          {room.studentName ?? room.name}
                          <small className="text-gray-8 ml-2 font-normal">
                            {room.name}
                          </small>
                        </span>
                        <UnstyledButton
                          variant="unstyled"
                          size="none"
                          type="button"
                          disabled={statusMutation.isPending}
                          onClick={() => changeRoomStatus(room.id, 'OPERATING')}
                          className="border-gray-3 text-gray-12 min-h-control-sm rounded-button px-button-compact-x cursor-pointer border bg-white text-xs font-bold disabled:opacity-50"
                        >
                          재개하기
                        </UnstyledButton>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
            {statusMutation.isError && (
              <p
                role="alert"
                className="text-system-warning-text bg-system-warning-alt border-system-warning p-card-pad rounded-card border text-sm font-bold"
              >
                수업 상태를 바꾸지 못했습니다. 잠시 후 다시 시도해 주세요.
              </p>
            )}
          </>
        )}
      </PageLayout>
    </div>
  );
};

export default DashboardTeacher;
