'use client';

import { useState } from 'react';

import type { Notice } from '@/entities/shell';
import {
  useNoticeMutations,
  useNoticesQuery,
} from '@/features/app-shell/hooks/use-shell-queries';
import { monthDayLabel } from '@/features/app-shell/model/format';
import { ScreenState } from '@/shared/components/screen-state';
import {
  Button,
  Input,
  Textarea,
  showBottomToast,
} from '@/shared/components/ui';
import { StatusBadge } from '@/shared/components/ui/status-badge';

type NoticeListProps = {
  roomId: number;
  role: 'student' | 'teacher';
};

const TITLE_MAX = 120;
const BODY_MAX = 4000;

const NoticeForm = ({ roomId }: { roomId: number }) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(false);
  const { create } = useNoticeMutations(roomId);
  const ready = title.trim().length > 0 && body.trim().length > 0;

  return (
    <form
      className="border-line-line1 rounded-card p-card-pad gap-content-gap flex flex-col border bg-white"
      onSubmit={(event) => {
        event.preventDefault();
        if (!ready) return;
        create.mutate(
          { title, body, pinned },
          {
            onSuccess: () => {
              setTitle('');
              setBody('');
              setPinned(false);
              showBottomToast('공지를 올렸어요');
            },
            onError: () =>
              showBottomToast('올리지 못했어요. 잠시 뒤에 다시 해 주세요'),
          }
        );
      }}
    >
      <Input
        value={title}
        maxLength={TITLE_MAX}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="공지 제목"
        aria-label="공지 제목"
      />
      <Textarea
        value={body}
        maxLength={BODY_MAX}
        onChange={(event) => setBody(event.target.value)}
        placeholder="공지 내용"
        aria-label="공지 내용"
      />
      <label className="font-body2-normal text-gray-10 gap-content-gap min-h-touch-min flex items-center">
        <input
          type="checkbox"
          checked={pinned}
          onChange={(event) => setPinned(event.target.checked)}
        />
        위에 고정
      </label>
      <Button
        type="submit"
        size="small"
        disabled={!ready || create.isPending}
      >
        공지 올리기
      </Button>
    </form>
  );
};

const NoticeRow = ({
  notice,
  roomId,
  canEdit,
}: {
  notice: Notice;
  roomId: number;
  canEdit: boolean;
}) => {
  const { remove } = useNoticeMutations(roomId);
  return (
    <li className="border-line-line1 rounded-card p-card-pad gap-content-gap flex flex-col border bg-white">
      <div className="gap-content-gap flex items-center">
        {notice.pinned && (
          <StatusBadge
            variant="primary"
            label="고정"
          />
        )}
        <h3 className="font-body2-heading text-text-main text-single-line">
          {notice.title}
        </h3>
      </div>
      <p className="font-body2-normal text-gray-10 whitespace-pre-wrap">
        {notice.body}
      </p>
      <div className="font-caption-normal text-gray-8 flex items-center justify-between">
        <span>
          {notice.authorName ? `${notice.authorName} · ` : ''}
          {monthDayLabel(notice.regDate)}
        </span>
        {canEdit && (
          <Button
            variant="ghost"
            size="compact"
            disabled={remove.isPending}
            onClick={() => remove.mutate(notice.id)}
          >
            지우기
          </Button>
        )}
      </div>
    </li>
  );
};

/** 교무실 공지 탭. 학생은 읽기만, 그 방 선생님은 올리고 지운다. 0건이면 안내 한 줄. */
export const NoticeList = ({ roomId, role }: NoticeListProps) => {
  const query = useNoticesQuery(role, roomId);
  const notices = query.data ?? [];
  const forbidden =
    (query.error as { response?: { status?: number } } | null)?.response
      ?.status === 403;

  return (
    <div
      className="gap-block-gap flex flex-col"
      data-testid="notice-list"
    >
      {role === 'teacher' && <NoticeForm roomId={roomId} />}
      <ScreenState
        status={
          forbidden
            ? 'forbidden'
            : query.isError
              ? 'error'
              : query.isPending
                ? 'loading'
                : notices.length === 0
                  ? 'empty'
                  : 'ready'
        }
        error={{ onRetry: () => query.refetch() }}
        empty={{ title: '아직 공지가 없어요' }}
        forbidden={{ title: '이 방의 구성원만 볼 수 있어요' }}
      >
        <ul className="gap-block-gap flex flex-col">
          {notices.map((notice) => (
            <NoticeRow
              key={notice.id}
              notice={notice}
              roomId={roomId}
              canEdit={role === 'teacher'}
            />
          ))}
        </ul>
      </ScreenState>
    </div>
  );
};
