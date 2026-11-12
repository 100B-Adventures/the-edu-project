'use client';

import type { WrongAnswerItem } from '@/entities/wrong-answer';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useStudentDashboardStudyRoomListQuery } from '@/features/dashboard/hooks/use-student-dashboard-query';
import { useWrongAnswersQuery } from '@/features/dashboard/hooks/use-wrong-answer-query';
import { useAssignedExamsQuery } from '@/features/exam/hooks/use-exam-query';
import { ListIcon } from '@/shared/components/icons';
import { Sidebar } from '@/shared/components/sidebar';
import { Button as UnstyledButton } from '@/shared/components/ui/button';
import { PRIVATE } from '@/shared/constants/route';
import { useRole } from '@/shared/hooks/use-role';
import { trackGnbLogoutClick } from '@/shared/lib/analytics';
import {
  ChartNoAxesCombined,
  ClipboardListIcon,
  Diamond,
  GraduationCap,
  Handshake,
  History,
  Home,
  LogOut,
  MessageCircle,
  Newspaper,
  NotebookText,
  Search,
  ShieldUserIcon,
  Sprout,
  User2Icon,
  Users,
} from 'lucide-react';

export const countDueActiveWrongAnswers = (
  items: WrongAnswerItem[],
  now = Date.now()
) =>
  items.filter(
    (item) =>
      item.status === 'ACTIVE' &&
      (!item.nextReviewAt || new Date(item.nextReviewAt).getTime() <= now)
  ).length;

const StudentSidebarCounts = ({ kind }: { kind: 'wrong' | 'exam' }) => {
  const wrongAnswers = useWrongAnswersQuery();
  const assignedExams = useAssignedExamsQuery();
  const count =
    kind === 'wrong'
      ? countDueActiveWrongAnswers(wrongAnswers.data?.items ?? [])
      : (assignedExams.data?.filter(
          (exam) => exam.status === 'ASSIGNED' || exam.status === 'IN_PROGRESS'
        ).length ?? 0);

  if (count === 0) return null;

  return (
    <span className="bg-orange-9 text-gray-white tablet:inline-flex ml-auto hidden min-h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-extrabold tabular-nums">
      {count}
    </span>
  );
};

export const DashboardSidebar = () => {
  const { role } = useRole();
  const { logout } = useAuth();
  const studentRooms = useStudentDashboardStudyRoomListQuery({
    enabled: role === 'ROLE_STUDENT',
  });
  const primaryRoom = studentRooms.data?.[0];

  const handleLogout = () => {
    logout();
    trackGnbLogoutClick(role ?? null);
  };

  return (
    <Sidebar
      expandedAtTablet={role === 'ROLE_STUDENT'}
      visibleAtTablet={role === 'ROLE_TEACHER' || role === 'ROLE_PARENT'}
    >
      {/* 태블릿(md~desktop 미만) 아이콘 레일에서는 'D' 만, desktop 이상만 전체 로고 텍스트 */}
      <div
        className={`text-orange-9 px-2 pt-1 pb-3 text-center text-sm font-extrabold tracking-[-0.045em] ${role === 'ROLE_STUDENT' ? 'tablet:hidden block' : 'desktop:hidden block'}`}
      >
        D
      </div>
      <div
        className={`text-orange-9 px-2 pt-1 pb-3 text-sm font-extrabold tracking-[-0.045em] ${role === 'ROLE_STUDENT' ? 'tablet:block hidden' : 'desktop:block hidden'}`}
      >
        D-EDU
        <small className="text-gray-8 text-ui-compact mt-0.5 block font-semibold tracking-normal">
          {role === 'ROLE_TEACHER'
            ? '선생님'
            : role === 'ROLE_PARENT'
              ? '학부모'
              : '내 학습'}
        </small>
      </div>
      {/* 학생 전용: 내 학습 / 친구 / 약점 트리 (2.0 학생 중심 코어) — 선생님·학부모 화면 아님 */}
      {role === 'ROLE_STUDENT' && (
        <>
          <Sidebar.Item href={PRIVATE.DASHBOARD.STUDENT}>
            <GraduationCap
              size={20}
              className="shrink-0"
            />
            <Sidebar.Text>내 학습</Sidebar.Text>
          </Sidebar.Item>

          <Sidebar.Item
            href={PRIVATE.DASHBOARD.STUDENT_RESULTS}
            matchPath={PRIVATE.DASHBOARD.STUDENT_RESULTS}
          >
            <ChartNoAxesCombined
              size={20}
              className="shrink-0"
            />
            <Sidebar.Text>내 성과</Sidebar.Text>
          </Sidebar.Item>

          <Sidebar.Item
            href={PRIVATE.DASHBOARD.STUDENT_LOOK_BACK}
            matchPath={PRIVATE.DASHBOARD.STUDENT_LOOK_BACK}
          >
            <History
              size={20}
              className="shrink-0"
            />
            <Sidebar.Text>돌아보기</Sidebar.Text>
          </Sidebar.Item>

          {primaryRoom && (
            <>
              <div className="text-gray-8 text-ui-compact tablet:block hidden px-2 pt-4 pb-1 font-extrabold">
                소속
              </div>
              <Sidebar.Item
                href={PRIVATE.ROOM.DETAIL(primaryRoom.id)}
                matchPath={`/study-rooms/${primaryRoom.id}`}
              >
                <ClipboardListIcon
                  size={20}
                  className="shrink-0"
                />
                <Sidebar.Text className="truncate">
                  {primaryRoom.name}
                </Sidebar.Text>
              </Sidebar.Item>
            </>
          )}

          <div className="text-gray-8 text-ui-compact tablet:block hidden px-2 pt-4 pb-1 font-extrabold">
            더 보기
          </div>

          <Sidebar.Item
            href={PRIVATE.DASHBOARD.WRONG_ANSWERS}
            matchPath={PRIVATE.DASHBOARD.WRONG_ANSWERS}
          >
            <History
              size={20}
              className="shrink-0"
            />
            <Sidebar.Text>오답 회독</Sidebar.Text>
            <StudentSidebarCounts kind="wrong" />
          </Sidebar.Item>

          <Sidebar.Item
            href={PRIVATE.DASHBOARD.EXAM_HALL}
            matchPath={PRIVATE.DASHBOARD.EXAM_HALL}
          >
            <Diamond
              size={20}
              className="shrink-0"
            />
            <Sidebar.Text>응시장</Sidebar.Text>
            <StudentSidebarCounts kind="exam" />
          </Sidebar.Item>

          {studentRooms.isSuccess && !primaryRoom && (
            <Sidebar.Item
              href={PRIVATE.DASHBOARD.CONNECTIONS}
              matchPath={PRIVATE.DASHBOARD.CONNECTIONS}
            >
              <Users
                size={20}
                className="shrink-0"
              />
              <Sidebar.Text>선생님 연결</Sidebar.Text>
            </Sidebar.Item>
          )}

          <Sidebar.Item
            href={PRIVATE.FRIENDS.INDEX}
            matchPath={PRIVATE.FRIENDS.INDEX}
          >
            <Handshake
              size={20}
              className="shrink-0"
            />
            <Sidebar.Text>친구</Sidebar.Text>
          </Sidebar.Item>

          <Sidebar.Item
            href={PRIVATE.POINTS.INDEX}
            matchPath={PRIVATE.POINTS.INDEX}
          >
            <Diamond
              size={20}
              className="shrink-0"
            />
            <Sidebar.Text>포인트</Sidebar.Text>
          </Sidebar.Item>
        </>
      )}

      {/* 선생님 전역 메뉴는 내 수업과 마이페이지만 둔다. */}
      {role === 'ROLE_TEACHER' && (
        <>
          <Sidebar.Item
            href={PRIVATE.DASHBOARD.TEACHER}
            matchPath={PRIVATE.DASHBOARD.TEACHER}
          >
            <ClipboardListIcon
              size={20}
              className="shrink-0"
            />
            <Sidebar.Text>내 수업</Sidebar.Text>
          </Sidebar.Item>
        </>
      )}

      {role === 'ROLE_TEACHER' && (
        <Sidebar.Item
          href={PRIVATE.DASHBOARD.TEACHER_MY}
          matchPath={PRIVATE.DASHBOARD.TEACHER_MY}
        >
          <User2Icon className="shrink-0" />
          <Sidebar.Text>마이페이지</Sidebar.Text>
        </Sidebar.Item>
      )}

      {role !== 'ROLE_TEACHER' && role !== 'ROLE_PARENT' && (
        <Sidebar.Item
          href={PRIVATE.MYPAGE}
          matchPath={PRIVATE.MYPAGE}
        >
          <User2Icon className="shrink-0" />
          <Sidebar.Text>마이페이지</Sidebar.Text>
        </Sidebar.Item>
      )}

      {role === 'ROLE_STUDENT' && (
        <>
          <div className="text-gray-8 text-ui-compact tablet:block hidden px-2 pt-4 pb-1 font-extrabold">
            오픈챌린지에서 열립니다
          </div>
          <Sidebar.Item
            href={PRIVATE.TREE.INDEX}
            matchPath={PRIVATE.TREE.INDEX}
          >
            <Sprout
              size={20}
              className="shrink-0"
            />
            <Sidebar.Text>약점 나무 ↗</Sidebar.Text>
          </Sidebar.Item>
        </>
      )}

      {/* 학부모 전용: v23 학부모 hub 정보 구조 6항목 */}
      {role === 'ROLE_PARENT' && (
        <>
          <Sidebar.Item href={PRIVATE.DASHBOARD.PARENT}>
            <Home
              size={20}
              className="shrink-0"
            />
            <Sidebar.Text>홈</Sidebar.Text>
          </Sidebar.Item>
          <Sidebar.Item href={PRIVATE.DASHBOARD.PARENT_STUDY_NEWS}>
            <Newspaper
              size={20}
              className="shrink-0"
            />
            <Sidebar.Text>학습 소식</Sidebar.Text>
          </Sidebar.Item>
          <Sidebar.Item href={PRIVATE.DASHBOARD.PARENT_STUDY_RECORDS}>
            <NotebookText
              size={20}
              className="shrink-0"
            />
            <Sidebar.Text>스터디룸 기록일지</Sidebar.Text>
          </Sidebar.Item>
          <div
            role="separator"
            aria-orientation="horizontal"
            className="border-gray-3 my-2 border-t"
          />
          <Sidebar.Item href={PRIVATE.DASHBOARD.PARENT_STUDY_ROOMS}>
            <Search
              size={20}
              className="shrink-0"
            />
            <Sidebar.Text>스터디룸 둘러보기</Sidebar.Text>
          </Sidebar.Item>
          <Sidebar.Item href={PRIVATE.DASHBOARD.PARENT_CONSULTATIONS}>
            <MessageCircle
              size={20}
              className="shrink-0"
            />
            <Sidebar.Text>상담 내역</Sidebar.Text>
          </Sidebar.Item>
          <Sidebar.Item href={PRIVATE.MYPAGE}>
            <User2Icon className="shrink-0" />
            <Sidebar.Text>마이페이지</Sidebar.Text>
          </Sidebar.Item>
        </>
      )}

      {role === 'ROLE_ADMIN' && (
        <>
          <Sidebar.Header>
            <div className="flex items-center gap-2">
              <ShieldUserIcon />
              <Sidebar.HeaderText>관리자</Sidebar.HeaderText>
            </div>
          </Sidebar.Header>

          <Sidebar.List>
            <li>
              <Sidebar.Item
                href={PRIVATE.ADMIN.MEMBERS.LIST}
                matchPath={PRIVATE.ADMIN.MEMBERS.LIST}
                className="h-12 items-center justify-start gap-0.5"
              >
                <Users size={20} />
                <Sidebar.Text className="font-body2-normal">
                  회원 관리
                </Sidebar.Text>
              </Sidebar.Item>
            </li>
            <li>
              <Sidebar.Item
                href={PRIVATE.ADMIN.COLUMN.LIST}
                matchPath={PRIVATE.ADMIN.COLUMN.LIST}
                className="h-12 items-center justify-start gap-0.5"
              >
                <ListIcon />
                <Sidebar.Text className="font-body2-normal">
                  칼럼 관리
                </Sidebar.Text>
              </Sidebar.Item>
            </li>
            <li>
              <Sidebar.Item
                href={PRIVATE.ADMIN.OPEN_CHALLENGE.LIST}
                matchPath={PRIVATE.ADMIN.OPEN_CHALLENGE.LIST}
                className="h-12 items-center justify-start gap-0.5"
              >
                <ListIcon />
                <Sidebar.Text className="font-body2-normal">
                  오픈챌린지 관리
                </Sidebar.Text>
              </Sidebar.Item>
            </li>
          </Sidebar.List>
        </>
      )}

      <div className="mt-auto flex justify-end p-2">
        <UnstyledButton
          variant="unstyled"
          size="none"
          type="button"
          onClick={handleLogout}
          className="text-text-sub2 hover:bg-background-gray font-body2-normal flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1"
        >
          <Sidebar.Text>로그아웃</Sidebar.Text>
          <LogOut size={20} />
        </UnstyledButton>
      </div>
    </Sidebar>
  );
};
