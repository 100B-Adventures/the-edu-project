'use client';

import { useReducer, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { StudyroomGroups } from '@/features/study-rooms/components/sidebar/groups';
import {
  useStudentStudyRoomDetailQuery,
  useTeacherStudyRoomDetailQuery,
} from '@/features/study-rooms/hooks';
import { useUpdateEnrollmentStatus } from '@/features/study-rooms/hooks/use-update-enrollment-status';
import { useUpdateThumbnail } from '@/features/study-rooms/hooks/use-update-thumbnail';
import {
  InputDialog,
  StudyroomConfirmDialog,
} from '@/shared/components/dialog';
import {
  dialogReducer,
  initialDialogState,
} from '@/shared/components/dialog/model/dialog-reducer';
import { SidebarButton } from '@/shared/components/sidebar';
import { Toggle } from '@/shared/components/ui';
import { StudyroomStatusToggle } from '@/shared/components/ui';
import { showBottomToast } from '@/shared/components/ui/bottom-toast';
import { PRIVATE } from '@/shared/constants';
import { useRole } from '@/shared/hooks/use-role';
import { isMvpHSliceEnabled } from '@/shared/lib/mvp-h-slice';
import { Info } from 'lucide-react';

import { useInvitationQuery } from '../../hooks/use-invitation-query';
import { useToggleInvitation } from '../../hooks/use-toggle-invitation';
import { StudyRoomDetail } from '../../model';
import { StudyRoomClassLinks } from './class-links';
import { StudyroomSidebarHeader } from './header';
import { InfoTooltipToast } from './info-tooltip';
import { useDeleteStudyRoom, useUpdateStudyRoomTitle } from './services/query';
import { StudyIntro, StudyStats } from './status';

export const StudyroomSidebar = ({
  studyRoomId,
  segment,
  selectedGroupId,
  onSelectGroup,
}: {
  studyRoomId: number;
  segment: string | undefined;
  selectedGroupId: number | 'all';
  onSelectGroup: (id: number | 'all') => void;
}) => {
  const router = useRouter();

  // 초대 다이얼로그 open 확인
  // const pathname = usePathname();
  // const searchParams = useSearchParams();
  // const isOpenInvite = searchParams.get('invite') === 'open';

  const [dialog, dispatch] = useReducer(dialogReducer, initialDialogState);
  const [deleteNoticeMsg, setDeleteNoticeMsg] =
    useState('수업노트 그룹이 삭제되었습니다.');
  const [isInfoToastOpen, setIsInfoToastOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { role } = useRole();

  const { mutate: deleteStudyRoom } = useDeleteStudyRoom();
  const { mutate: updateRoomName } = useUpdateStudyRoomTitle();
  const {
    data: invitation,
    isLoading: isInvitationLoading,
    isError: isInvitationError,
    refetch: refetchInvitation,
  } = useInvitationQuery(studyRoomId, { enabled: role === 'ROLE_TEACHER' });
  const { mutate: toggleInvitation, isPending: isInvitationPending } =
    useToggleInvitation(studyRoomId);
  const { mutate: updateEnrollmentStatus } =
    useUpdateEnrollmentStatus(studyRoomId);
  const { mutate: updateThumbnail, isPending: isUploadingThumbnail } =
    useUpdateThumbnail(studyRoomId);

  // 스터디룸 상세 정보 조회 (선생님)
  const { data: teacherStudyRoomDetail } = useTeacherStudyRoomDetailQuery(
    studyRoomId,
    {
      enabled: role === 'ROLE_TEACHER',
    }
  );

  // 스터디룸 상세 정보 조회 (학생)
  const { data: studentStudyRoomDetail } = useStudentStudyRoomDetailQuery(
    studyRoomId,
    {
      enabled: role === 'ROLE_STUDENT',
    }
  );

  let studyRoomDetail: StudyRoomDetail | undefined;
  if (role === 'ROLE_TEACHER') studyRoomDetail = teacherStudyRoomDetail;
  if (role === 'ROLE_STUDENT') studyRoomDetail = studentStudyRoomDetail;

  // 삭제, 수정, 학생 초대 등 관리 권한
  const canManage = role === 'ROLE_TEACHER';

  // 스터디룸 이름 변경
  const handleSubmitRoomRename = (name: string, others: StudyRoomDetail) => {
    updateRoomName(
      { studyRoomId, name, others },
      {
        onSuccess: () => {
          dispatch({ type: 'CLOSE' });
        },
      }
    );
  };

  // 스터디룸 삭제
  const handleDeleteGroup = () => {
    deleteStudyRoom(
      { studyRoomId },
      {
        onSuccess: () => {
          setDeleteNoticeMsg('스터디룸이 삭제되었습니다.');
          dispatch({ type: 'GO_TO_CONFIRM' });
        },
      }
    );
  };
  const onConfirmDelete = () => {
    router.push(PRIVATE.DASHBOARD.TEACHER);
  };

  // 썸네일 핸들러
  const handleThumbnailClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    updateThumbnail(file);
    e.target.value = '';
  };

  const handleThumbnailDelete = () => updateThumbnail(null);

  // 초대 링크 복사 후 Bottom Toast 표시, token 수정 필요
  const handleCopyInviteLink = async () => {
    if (invitation === undefined) return;

    const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/invite?token=${invitation.token}`;
    await navigator.clipboard.writeText(inviteLink);
    showBottomToast('학생 초대 링크가 복사됐어요. 링크를 공유해보세요');
  };

  if (!segment) return null;
  return (
    <>
      {dialog.status === 'open' && dialog.kind === 'onConfirm' && (
        <StudyroomConfirmDialog
          type="confirm"
          open={true}
          dispatch={dispatch}
          description={deleteNoticeMsg}
          onConfirm={onConfirmDelete}
        />
      )}

      {dialog.status === 'open' &&
        dialog.kind === 'delete' &&
        dialog.scope === 'studyroom' && (
          <StudyroomConfirmDialog
            type="delete"
            open={true}
            dispatch={dispatch}
            onDelete={() => handleDeleteGroup()}
            title="스터디룸을 삭제하시겠습니까?"
            description="삭제된 스터디룸은 복구할 수 없습니다."
          />
        )}

      {dialog.status === 'open' &&
        dialog.kind === 'rename' &&
        dialog.scope === 'studyroom' &&
        studyRoomDetail && (
          <InputDialog
            isOpen={true}
            placeholder={studyRoomDetail?.name || ''}
            onOpenChange={() => dispatch({ type: 'CLOSE' })}
            title="스터디룸 이름 변경"
            onSubmit={(newName) =>
              handleSubmitRoomRename(newName, studyRoomDetail)
            }
          />
        )}

      <section className="border-line-line1 flex h-fit w-full flex-col gap-5 rounded-xl border bg-white px-8 py-8">
        <StudyroomSidebarHeader
          dispatch={dispatch}
          studyRoomId={studyRoomId}
          studyRoomName={studyRoomDetail?.name}
          teacherName={studyRoomDetail?.teacherName}
          canManage={canManage}
          thumbnailUrl={studyRoomDetail?.thumbnailUrl}
          onThumbnailClick={canManage ? handleThumbnailClick : undefined}
          onThumbnailDelete={canManage ? handleThumbnailDelete : undefined}
          isUploading={isUploadingThumbnail}
        />
        {/* 썸네일 input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <StudyStats
          numberOfTeachingNote={studyRoomDetail?.numberOfTeachingNote}
          numberOfStudents={studyRoomDetail?.studentNames?.length}
          numberOfQuestion={studyRoomDetail?.numberOfQuestion}
        />
        <StudyIntro description={studyRoomDetail?.description} />

        {/* 운영 상태 토글 - 선생님만 노출 */}
        {canManage && (
          <StudyroomStatusToggle
            value={studyRoomDetail?.enrollmentStatus ?? null}
            onChange={(status) => {
              updateEnrollmentStatus(status);
            }}
          />
        )}

        {/* 학생 초대 버튼 - 선생님만 노출 */}
        {canManage && (
          <div className="flex flex-col gap-4">
            <SidebarButton
              onClick={handleCopyInviteLink}
              btnName="학생 초대하기"
              imgUrl="/studynotes/invite_student.svg"
              disabled={!invitation?.enabled}
            />
            {/*
              H3: 조건 없는 영구 비활성 금지. 못 누르는 이유를 화면에 적는다.
              QA 8차 C조는 이 두 조작이 "조건 없는 비활성"으로 보인다고 판정했는데,
              실제 원인은 초대 링크 조회가 아직 안 끝났거나 실패했을 때 아무 설명 없이
              꺼진 채로 남는 것이었다. 이유와 회복 경로를 함께 붙였다.
            */}
            {!invitation?.enabled && (
              <p
                className="text-gray-7 font-caption-normal"
                data-testid="study-room-invite-disabled-reason"
              >
                {isInvitationError ? (
                  <>
                    초대 링크 정보를 불러오지 못했습니다.{' '}
                    <button
                      type="button"
                      className="text-orange-9 cursor-pointer font-bold underline"
                      onClick={() => refetchInvitation()}
                    >
                      다시 불러오기
                    </button>
                  </>
                ) : isInvitationLoading ? (
                  '초대 링크 상태를 불러오는 중입니다.'
                ) : (
                  '초대 링크가 꺼져 있어 지금은 복사할 수 없습니다. 아래 스위치를 켜면 바로 복사됩니다.'
                )}
              </p>
            )}
            <div className="flex gap-2">
              <Toggle
                checked={invitation?.enabled ?? false}
                onCheckedChange={toggleInvitation}
                disabled={isInvitationPending || (isInvitationLoading && !invitation)}
                aria-label="초대 링크 활성화"
              />
              <div className="flex flex-1 flex-col gap-0.5">
                <div className="text-gray-10 flex items-center gap-1">
                  <p className="font-label-heading tablet:font-body2-heading">
                    초대 링크 활성화
                  </p>
                  <div className="relative flex items-center justify-center">
                    <button
                      type="button"
                      onMouseEnter={() => setIsInfoToastOpen(true)}
                      aria-label="초대 링크 활성화 안내"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                    <InfoTooltipToast
                      toggleEnabled={invitation?.enabled ?? false}
                      isOpen={isInfoToastOpen}
                      onClose={() => setIsInfoToastOpen(false)}
                    />
                  </div>
                </div>
                <p className="text-gray-7 font-caption-normal tablet:font-label-normal">
                  링크를 비활성화하면, 학생을 초대할 수 없어요.
                </p>
              </div>
            </div>
          </div>
        )}
        {/* 수업 링크 */}
        <StudyRoomClassLinks
          studyRoomId={studyRoomId}
          canManage={canManage}
        />
        {isMvpHSliceEnabled() && (
          <SidebarButton
            onClick={() => router.push(PRIVATE.ROOM.LESSON(studyRoomId))}
            btnName="1:1 수업"
            imgUrl="/studynotes/invite_student.svg"
          />
        )}
        {/* 수업노트 탭에서만 보이는 컴포넌트 */}
        {segment === 'note' && (
          <StudyroomGroups
            role={role}
            studyRoomId={studyRoomId}
            selectedGroupId={selectedGroupId}
            handleSelectGroupId={onSelectGroup}
          />
        )}
      </section>
    </>
  );
};
