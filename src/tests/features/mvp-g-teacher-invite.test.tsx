import { PublicTeacherInvite } from '@/features/teacher-invite/components/public-teacher-invite';
import { StudentTeacherInviteCard } from '@/features/teacher-invite/components/student-teacher-invite-card';
import { renderWithProviders } from '@/tests/utils';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  issue: vi.fn(),
  state: vi.fn(),
  revoke: vi.fn(),
  snooze: vi.fn(),
  preview: vi.fn(),
  accept: vi.fn(),
  impression: vi.fn(),
  issueSuccess: vi.fn(),
  acceptSuccess: vi.fn(),
  snoozeEvent: vi.fn(),
  rooms: vi.fn(),
}));

vi.mock('@/entities/teacher-invite', () => ({
  teacherInviteRepository: mocks,
}));

vi.mock('@/shared/lib/analytics', () => ({
  trackTeacherInviteBannerImpression: mocks.impression,
  trackTeacherInviteIssueSuccess: mocks.issueSuccess,
  trackSignUpConversion: vi.fn(),
  trackTeacherInviteAcceptSuccess: mocks.acceptSuccess,
  trackTeacherInviteSnooze: mocks.snoozeEvent,
}));

vi.mock('@/features/dashboard/hooks/use-student-dashboard-query', () => ({
  useStudentDashboardStudyRoomListQuery: mocks.rooms,
}));

describe('MVP-G 선생님 초대 상호작용 계약', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  beforeEach(() => {
    mocks.rooms.mockReturnValue({
      data: [{ id: 701, name: '김학생 학습방' }],
      isSuccess: true,
    });
    mocks.state.mockResolvedValue({
      mode: 'VISIBLE',
      hiddenUntil: null,
      hiddenForever: false,
    });
  });

  test('TC-INV-001 학생이 초대 링크를 만들고 폐기한다', async () => {
    mocks.issue.mockResolvedValue({
      inviteUrl: 'https://d-edu.example/invite/token-82',
      expiresAt: '2026-09-12T00:00:00Z',
    });
    mocks.revoke.mockResolvedValue(undefined);

    renderWithProviders(<StudentTeacherInviteCard />);
    fireEvent.click(
      await screen.findByRole('button', { name: '초대 링크 만들기' })
    );

    expect(await screen.findByTestId('teacher-invite-url')).toHaveTextContent(
      'https://d-edu.example/invite/token-82'
    );
    fireEvent.click(screen.getByRole('button', { name: '링크 폐기' }));
    await waitFor(() => expect(mocks.revoke).toHaveBeenCalledOnce());
    expect(
      await screen.findByRole('button', { name: '초대 링크 만들기' })
    ).toBeVisible();
    expect(mocks.issueSuccess).toHaveBeenCalledOnce();
  });

  test('TC-INV-008 학생이 영구 숨김을 선택하면 홈 카드를 닫는다', async () => {
    mocks.snooze.mockResolvedValue({
      mode: 'HIDDEN_FOREVER',
      hiddenUntil: null,
      hiddenForever: true,
    });
    renderWithProviders(<StudentTeacherInviteCard compact />);

    fireEvent.click(
      await screen.findByRole('button', { name: '괜찮아요' })
    );

    await waitFor(() => expect(mocks.snooze).toHaveBeenCalledWith('FOREVER'));
    await waitFor(() =>
      expect(screen.queryByTestId('student-teacher-invite-card')).toBeNull()
    );
    expect(mocks.impression).toHaveBeenCalledOnce();
    expect(mocks.snoozeEvent).toHaveBeenCalledWith('FOREVER');
    await waitFor(() => expect(mocks.state).toHaveBeenCalledTimes(2));
    expect(mocks.impression).toHaveBeenCalledOnce();
  });

  test('TC-AN-001 StrictMode 재실행에도 impression은 mount당 한 번만 전송한다', async () => {
    const view = renderWithProviders(
      <StrictMode>
        <StudentTeacherInviteCard compact />
      </StrictMode>
    );

    expect(await screen.findByTestId('student-teacher-invite-card')).toBeVisible();
    view.rerender(
      <StrictMode>
        <StudentTeacherInviteCard compact />
      </StrictMode>
    );
    await waitFor(() => expect(mocks.impression).toHaveBeenCalledOnce());
  });

  test('TC-AN-001 발행 실패에는 issue success event를 보내지 않는다', async () => {
    mocks.issue.mockRejectedValue(new Error('issue failed'));
    renderWithProviders(<StudentTeacherInviteCard />);

    fireEvent.click(
      await screen.findByRole('button', { name: '초대 링크 만들기' })
    );

    expect(await screen.findByRole('alert')).toBeVisible();
    expect(mocks.issueSuccess).not.toHaveBeenCalled();
  });

  test('TC-INV-019 새로고침 뒤 저장된 유예 상태면 홈 카드를 다시 노출하지 않는다', async () => {
    mocks.state.mockResolvedValue({
      mode: 'SNOOZED',
      hiddenUntil: '2026-09-01T00:00:00',
      hiddenForever: false,
    });

    renderWithProviders(<StudentTeacherInviteCard compact />);

    await waitFor(() => expect(mocks.state).toHaveBeenCalledOnce());
    expect(screen.queryByTestId('student-teacher-invite-card')).toBeNull();
    expect(mocks.impression).not.toHaveBeenCalled();
  });

  test('TC-INV-020 연결 완료 학생이 직접 경로를 열어도 발행 버튼 대신 완료 상태를 본다', async () => {
    mocks.state.mockResolvedValue({
      mode: 'CONNECTED',
      hiddenUntil: null,
      hiddenForever: false,
    });

    renderWithProviders(<StudentTeacherInviteCard />);

    expect(
      await screen.findByTestId('student-teacher-invite-connected')
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: '초대 링크 만들기' })
    ).toBeNull();
    expect(
      screen.getByRole('link', { name: '김학생 학습방 열기' })
    ).toHaveAttribute('href', '/study-rooms/701/note');
  });

  test('TC-INV-020 연결 상태 조회 중에는 직접 경로에서도 발행 CTA를 노출하지 않는다', () => {
    mocks.state.mockReturnValue(new Promise(() => undefined));

    renderWithProviders(<StudentTeacherInviteCard />);

    expect(screen.getByTestId('student-teacher-invite-loading')).toBeVisible();
    expect(
      screen.queryByRole('button', { name: '초대 링크 만들기' })
    ).toBeNull();
  });

  test('TC-INV-012 로그인한 선생님 계정으로 수락하고 생성된 방으로 이동한다', async () => {
    mocks.preview.mockResolvedValue({
      studentName: '김학생',
      valid: true,
    });
    mocks.accept.mockResolvedValue({
      teacherId: 7,
      studentId: 8,
      studyRoomId: 9,
      inviteStatus: 'ACCEPTED',
      acceptedAt: '2026-08-29T00:00:00Z',
    });

    renderWithProviders(<PublicTeacherInvite token="token-existing" />);
    fireEvent.click(
      await screen.findByRole('button', {
        name: '로그인한 선생님 계정으로 수락',
      })
    );

    expect(
      await screen.findByTestId('teacher-invite-accepted')
    ).toHaveTextContent('김학생 학생과 연결됐습니다');
    expect(screen.getByRole('link', { name: '스터디룸 열기' })).toHaveAttribute(
      'href',
      '/study-rooms/9/note'
    );
    expect(mocks.accept).toHaveBeenCalledWith('token-existing', {
      mode: 'EXISTING_ACCOUNT',
    });
    expect(mocks.acceptSuccess).toHaveBeenCalledWith('EXISTING_ACCOUNT');
  });

  test('TC-INV-011 처음 온 선생님이 가입 정보를 입력해 초대를 수락한다', async () => {
    mocks.preview.mockResolvedValue({ studentName: '김O생', valid: true });
    mocks.accept.mockResolvedValue({
      teacherId: 17,
      studentId: 18,
      studyRoomId: 19,
      inviteStatus: 'ACCEPTED',
      acceptedAt: '2026-08-29T00:00:00Z',
    });

    renderWithProviders(<PublicTeacherInvite token="token-sign-up" />);
    fireEvent.change(await screen.findByLabelText('이메일'), {
      target: { value: 'teacher@example.com' },
    });
    fireEvent.change(screen.getByLabelText('비밀번호'), {
      target: { value: 'Valid123!' },
    });
    fireEvent.change(screen.getByLabelText('이름'), {
      target: { value: '김선생' },
    });
    fireEvent.change(screen.getByLabelText('전화번호'), {
      target: { value: '010-0000-0000' },
    });
    fireEvent.click(screen.getAllByRole('checkbox')[0]!);
    fireEvent.click(screen.getByRole('button', { name: '가입하고 연결하기' }));

    await waitFor(() =>
      expect(mocks.accept).toHaveBeenCalledWith('token-sign-up', {
        mode: 'SIGN_UP',
        email: 'teacher@example.com',
        password: 'Valid123!',
        name: '김선생',
        phoneNumber: '010-0000-0000',
        agreeServiceTerms: true,
        agreePrivacyTerms: true,
        agreeAgeCheck: true,
        agreeMarketing: true,
      })
    );
    expect(mocks.acceptSuccess).toHaveBeenCalledWith('SIGN_UP');
    expect(await screen.findByTestId('teacher-invite-accepted')).toBeVisible();
  });

  test('TC-AN-001 수락 실패에는 accept success event를 보내지 않는다', async () => {
    mocks.preview.mockResolvedValue({ studentName: '김학생', valid: true });
    mocks.accept.mockRejectedValue(new Error('accept failed'));
    renderWithProviders(<PublicTeacherInvite token="token-failed" />);

    fireEvent.click(
      await screen.findByRole('button', {
        name: '로그인한 선생님 계정으로 수락',
      })
    );

    expect(await screen.findByRole('alert')).toBeVisible();
    expect(mocks.acceptSuccess).not.toHaveBeenCalled();
  });

  test('TC-INV-009 사용할 수 없는 토큰은 가입 폼을 노출하지 않는다', async () => {
    mocks.preview.mockRejectedValue(new Error('expired'));

    renderWithProviders(<PublicTeacherInvite token="token-expired" />);

    expect(
      await screen.findByText('사용할 수 없는 초대 링크입니다')
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: '가입하고 연결하기' })
    ).toBeNull();
  });

  test.each([
    [
      'TEACHER_INVITE_EXPIRED',
      '초대 링크가 만료됐어요',
      '초대 링크의 14일 사용 기간이 지났습니다.',
      '학생에게 새 링크를 요청해주세요',
    ],
    [
      'TEACHER_INVITE_REVOKED',
      '학생이 이 링크를 취소했어요',
      '학생이 폐기한 초대 링크입니다.',
      '학생에게 현재 링크를 확인해주세요',
    ],
    [
      'TEACHER_INVITE_ALREADY_USED',
      '이미 사용된 초대 링크예요',
      '이미 사용된 초대 링크입니다.',
      '로그인하고 내 수업 확인하기',
    ],
  ])('TC-INV-010 %s 410은 전용 제목과 다음 행동을 보존한다', async (code, title, message, action) => {
    mocks.preview.mockRejectedValue({
      isAxiosError: true,
      response: { data: { code, message } },
    });

    renderWithProviders(<PublicTeacherInvite token={`token-${code}`} />);

    expect(await screen.findByRole('heading', { name: title })).toBeVisible();
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    if (code === 'TEACHER_INVITE_ALREADY_USED') {
      expect(screen.getByRole('link', { name: action })).toHaveAttribute(
        'href',
        '/login'
      );
    } else {
      expect(screen.getByText(action)).toBeVisible();
      expect(screen.queryByRole('link', { name: action })).toBeNull();
    }
  });
});
