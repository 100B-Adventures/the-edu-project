'use client';

import { FormEvent, useState } from 'react';

import Link from 'next/link';

import {
  type TeacherInviteAccept,
  type TeacherInviteAcceptInput,
  teacherInviteRepository,
} from '@/entities/teacher-invite';
import {
  TERMS,
  TermsAgreement,
} from '@/features/auth/components/terms-agreement';
import { Button, Input } from '@/shared/components/ui';
import { PRIVATE, PUBLIC } from '@/shared/constants/route';
import { useCheckboxGroup } from '@/shared/hooks/use-checkbox-group';
import {
  trackSignUpConversion,
  trackTeacherInviteAcceptSuccess,
} from '@/shared/lib/analytics';
import { getApiError } from '@/shared/lib/get-api-error';
import { useMutation, useQuery } from '@tanstack/react-query';

const INVITE_ERROR_CONTENT: Record<
  string,
  { title: string; message: string; action: string; actionHref: string | null }
> = {
  TEACHER_INVITE_EXPIRED: {
    title: '초대 링크가 만료됐어요',
    message: '초대 링크의 14일 사용 기간이 지났습니다.',
    action: '학생에게 새 링크를 요청해주세요',
    actionHref: null,
  },
  TEACHER_INVITE_REVOKED: {
    title: '학생이 이 링크를 취소했어요',
    message: '학생이 폐기한 초대 링크입니다.',
    action: '학생에게 현재 링크를 확인해주세요',
    actionHref: null,
  },
  TEACHER_INVITE_ALREADY_USED: {
    title: '이미 사용된 초대 링크예요',
    message: '이미 사용된 초대 링크입니다.',
    action: '로그인하고 내 수업 확인하기',
    actionHref: PUBLIC.CORE.LOGIN,
  },
};

export const PublicTeacherInvite = ({ token }: { token: string }) => {
  const [accepted, setAccepted] = useState<TeacherInviteAccept | null>(null);
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    phoneNumber: '',
  });
  const terms = useCheckboxGroup(TERMS.map((term) => term.value));
  const requiredTermsAccepted = TERMS.filter((term) => term.required).every(
    (term) => terms.checkedItems.includes(term.value)
  );
  const preview = useQuery({
    queryKey: ['teacher-invite', token],
    queryFn: () => teacherInviteRepository.preview(token),
    retry: false,
  });
  const accept = useMutation({
    mutationFn: (input: TeacherInviteAcceptInput) =>
      teacherInviteRepository.accept(token, input),
    onSuccess: (result, input) => {
      setAccepted(result);
      if (input.mode === 'SIGN_UP') trackSignUpConversion('invite');
      trackTeacherInviteAcceptSuccess(input.mode);
    },
  });

  if (preview.isPending)
    return (
      <p className="p-6 text-center text-sm">초대 링크를 확인하는 중입니다.</p>
    );
  if (preview.isError || !preview.data) {
    const apiError = getApiError(preview.error);
    const content = apiError?.code
      ? (INVITE_ERROR_CONTENT[apiError.code] ?? {
        title: '사용할 수 없는 초대 링크입니다',
        message: '존재하지 않거나 사용할 수 없는 초대 링크입니다.',
        action: '로그인으로 이동',
        actionHref: PUBLIC.CORE.LOGIN,
        })
      : {
          title: '사용할 수 없는 초대 링크입니다',
          message: '존재하지 않거나 사용할 수 없는 초대 링크입니다.',
          action: '로그인으로 이동',
          actionHref: PUBLIC.CORE.LOGIN,
        };
    return (
      <div className="max-w-dialog mx-auto p-6 text-center">
        <h1 className="text-lg font-extrabold">
          {content.title}
        </h1>
        <p
          className="text-gray-9 mt-2 text-sm"
          role="alert"
        >
          {content.message}
        </p>
        {content.actionHref ? (
          <Link
            className="text-orange-11 mt-4 inline-block font-bold"
            href={content.actionHref}
          >
            {content.action}
          </Link>
        ) : (
          <p className="text-orange-11 mt-4 font-bold">{content.action}</p>
        )}
      </div>
    );
  }
  if (accepted)
    return (
      <div
        className="max-w-dialog mx-auto p-6 text-center"
        data-testid="teacher-invite-accepted"
      >
        <h1 className="text-xl font-extrabold">
          {preview.data.studentName} 학생과 연결됐습니다
        </h1>
        <p className="text-gray-9 mt-2 text-sm">
          스터디룸이 생성되고 학생이 바로 승인됐습니다.
        </p>
        <Link
          className="bg-orange-9 mt-5 inline-grid min-h-11 place-items-center rounded-lg px-5 text-sm font-bold text-white"
          href={PRIVATE.ROOM.DETAIL(accepted.studyRoomId)}
        >
          스터디룸 열기
        </Link>
      </div>
    );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!requiredTermsAccepted) return;
    accept.mutate({
      mode: 'SIGN_UP',
      ...form,
      agreeServiceTerms: terms.checkedItems.includes('terms'),
      agreePrivacyTerms: terms.checkedItems.includes('privacy'),
      agreeAgeCheck: terms.checkedItems.includes('ageCheck'),
      agreeMarketing: terms.checkedItems.includes('marketing'),
    });
  };

  return (
    <main className="max-w-dialog mx-auto p-6">
      <h1 className="text-xl font-extrabold">
        {preview.data.studentName} 학생의 선생님으로 연결
      </h1>
      <p className="text-gray-9 mt-2 text-sm leading-6">
        수락하면 1:1 스터디룸이 만들어지고 학생은 바로 승인됩니다.
      </p>
      <Button
        className="mt-5 w-full"
        variant="outlined"
        disabled={accept.isPending}
        onClick={() => accept.mutate({ mode: 'EXISTING_ACCOUNT' })}
      >
        로그인한 선생님 계정으로 수락
      </Button>
      <div className="border-gray-3 my-5 border-t" />
      <form
        className="space-y-3"
        onSubmit={submit}
      >
        <h2 className="text-sm font-extrabold">처음 오셨다면 가입하고 수락</h2>
        <Input
          aria-label="이메일"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))}
        />
        <Input
          aria-label="비밀번호"
          type="password"
          required
          value={form.password}
          onChange={(e) => setForm((v) => ({ ...v, password: e.target.value }))}
        />
        <Input
          aria-label="이름"
          required
          value={form.name}
          onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))}
        />
        <Input
          aria-label="전화번호"
          required
          placeholder="010-0000-0000"
          value={form.phoneNumber}
          onChange={(e) =>
            setForm((v) => ({ ...v, phoneNumber: e.target.value }))
          }
        />
        <TermsAgreement
          isAllChecked={terms.isAllChecked}
          toggleAll={terms.toggleAll}
          getCheckboxProps={terms.getCheckboxProps}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={!requiredTermsAccepted}
          isLoading={accept.isPending}
          loadingText="연결하는 중"
        >
          가입하고 연결하기
        </Button>
      </form>
      {accept.isError && (
        <p
          className="text-system-warning-text mt-3 text-xs"
          role="alert"
        >
          기존 계정이면 로그인한 뒤 다시 수락해주세요. 입력값도 함께
          확인해주세요.
        </p>
      )}
    </main>
  );
};
