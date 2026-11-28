'use client';

import { useEffect, useReducer, useState } from 'react';

import { useRouter } from 'next/navigation';

import { NotificationItem } from '@/entities/notification';
import NotificationIcon from '@/features/notifications/components/notification-icon';
import {
  useDeleteNotifications,
  useMarkAsRead,
  useNotifications,
  useUnreadNotifications,
} from '@/features/notifications/hooks/use-notifications';
import {
  ConfirmDialog,
  dialogReducer,
  initialDialogState,
} from '@/shared/components/dialog';
import { Skeleton } from '@/shared/components/loading';
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover';
import { PRIVATE } from '@/shared/constants';
import { trackGnbAlarmClick } from '@/shared/lib/analytics';
import { cn } from '@/shared/lib/utils';
import { useMemberStore } from '@/store';
import { Settings, Trash2Icon } from 'lucide-react';

const NOTIFICATION_CONTENT_CLASS_NAME = 'h-80 w-full bg-white';
const NOTIFICATION_POPOVER_CLASS_NAME =
  'mr-4 w-80 tablet:w-100 overflow-hidden p-0';

export function NotificationPopover() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const session = useMemberStore((s) => s.member);
  const { data, isLoading, error } = useNotifications({
    enabled: isOpen,
  });
  const { data: unread, refetch: refetchUnread } = useUnreadNotifications();
  const markAsRead = useMarkAsRead();
  const deleteNotifications = useDeleteNotifications();

  const shouldHideHomework = !session?.role || session.role === 'ROLE_PARENT';
  const notifications = (data ?? []).filter(
    (notification) =>
      !shouldHideHomework || notification.category !== 'HOMEWORK'
  );
  const hasNotifications = notifications.length > 0;
  const unreadNotifications = (unread ?? []).filter(
    (notification) =>
      !shouldHideHomework || notification.category !== 'HOMEWORK'
  );
  const hasUnreadNotifications = unreadNotifications.length > 0;

  const [dialog, dispatch] = useReducer(dialogReducer, initialDialogState);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      refetchUnread();
    }
  }, [isOpen, refetchUnread]);

  // 개별 읽음 처리
  const handleNotificationClick = (notification: NotificationItem) => {
    if (!notification.isRead) markAsRead.mutate([notification.id]);
    if (notification.targetUrl) {
      router.push(notification.targetUrl);
      setIsOpen(false);
    }
  };

  // 전체 읽음 처리
  const handleMarkAllRead = () => {
    if (!hasUnreadNotifications) return;

    const unreadIds = unreadNotifications.map(
      (notification) => notification.id
    );
    markAsRead.mutate(unreadIds);
  };

  // 개별 삭제
  const handleDelete = (id: number) => {
    deleteNotifications.mutate([id]);
  };

  // 전체 삭제
  const handleDeleteAll = () => {
    if (!hasNotifications) return;

    const allIds = notifications.map((notification) => notification.id);
    deleteNotifications.mutate(allIds);

    dispatch({ type: 'GO_TO_CONFIRM' });
  };

  return (
    <>
      <Popover
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className="relative flex size-11 cursor-pointer items-center justify-center outline-none"
            aria-label="알림 확인"
            onClick={() => {
              // GNB 알림 아이콘 클릭 이벤트 전송
              trackGnbAlarmClick(session?.role ?? null);
            }}
          >
            <NotificationIcon hasNotifications={hasUnreadNotifications} />
            <span className="sr-only">알림</span>
          </button>
        </PopoverTrigger>

        <PopoverContent className={NOTIFICATION_POPOVER_CLASS_NAME}>
          <header className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="text-lg font-semibold">알림</h2>
            <PopoverClose asChild>
              <button
                type="button"
                className="cursor-pointer text-sm text-gray-500 hover:text-gray-700"
              >
                닫기
              </button>
            </PopoverClose>
          </header>

          {isLoading && (
            <ul
              className={cn(NOTIFICATION_CONTENT_CLASS_NAME, 'overflow-hidden')}
            >
              {Array.from({ length: 4 }).map((_, index) => (
                <li
                  key={index}
                  className="flex items-start justify-between border-b px-6 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <Skeleton.Block className="h-3 w-16" />
                    <Skeleton.Block className="mt-3 h-4 w-full" />
                  </div>
                </li>
              ))}
            </ul>
          )}
          {error && (
            <div
              className={cn(
                NOTIFICATION_CONTENT_CLASS_NAME,
                'flex items-center justify-center px-6 py-12 text-sm text-gray-500'
              )}
            >
              <p>알림을 불러오는데 실패했습니다.</p>
            </div>
          )}

          {!isLoading && !error && hasNotifications && (
            <ul
              className={cn(NOTIFICATION_CONTENT_CLASS_NAME, 'overflow-y-auto')}
            >
              {notifications.map((item) => (
                <li
                  key={item.id}
                  className={cn(
                    'flex items-stretch justify-between border-b transition-colors',
                    'hover:bg-gray-100'
                  )}
                >
                  <button
                    type="button"
                    className="focus-ring flex min-w-0 flex-1 cursor-pointer items-start justify-between px-6 py-4 text-left"
                    data-testid={`notification-item-${item.id}`}
                    onClick={() => handleNotificationClick(item)}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="text-text-sub2 block text-xs font-semibold">
                        {item.categoryKorean}
                      </span>
                      <span
                        className={`mt-1 line-clamp-2 block text-sm leading-relaxed hover:underline ${item.isRead ? 'font-body2-normal text-text-sub2' : 'font-body2-heading'}`}
                      >
                        {item.message}
                      </span>
                    </span>
                    <span className="ml-3 shrink-0 text-xs text-gray-400">
                      {item.relativeTime}
                    </span>
                  </button>
                  <div className="flex items-center pr-4">
                    <button
                      type="button"
                      className="text-text-sub2 hover:text-text-main flex size-11 cursor-pointer items-center justify-center"
                      aria-label="알림 삭제"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2Icon size={20} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!isLoading && !error && !hasNotifications && (
            <div
              className={cn(
                NOTIFICATION_CONTENT_CLASS_NAME,
                'flex items-center justify-center px-6 py-12 text-sm text-gray-500'
              )}
            >
              <p>최근 90일 동안 받은 알림이 없어요.</p>
            </div>
          )}

          <footer className="flex items-center justify-between border-t bg-gray-900 px-6 py-4 text-sm text-white">
            <div>
              <button
                type="button"
                className="cursor-pointer hover:underline"
                onClick={() => {
                  dispatch({
                    type: 'OPEN',
                    scope: 'notification',
                    kind: 'delete',
                  });
                  setIsDialogOpen(true);
                }}
              >
                전체 삭제
              </button>
              <span aria-hidden> | </span>
              <button
                type="button"
                className="cursor-pointer hover:underline"
                onClick={handleMarkAllRead}
              >
                전체 읽음
              </button>
            </div>
            <button
              type="button"
              className="flex cursor-pointer items-center gap-1 hover:underline"
              aria-label="알림 설정"
              onClick={() => {
                router.push(PRIVATE.SETTINGS);
                setIsOpen(false);
              }}
            >
              <Settings
                size={16}
                aria-hidden
              />
              알림 설정
            </button>
          </footer>
        </PopoverContent>
      </Popover>

      {dialog.status === 'open' && dialog.kind === 'delete' && (
        <ConfirmDialog
          variant="delete"
          open={isDialogOpen}
          dispatch={dispatch}
          onConfirm={handleDeleteAll}
          emphasis="none"
          title="전체 알림을 삭제하시겠습니까?"
          description="삭제된 알림은 복구할 수 없습니다."
        />
      )}

      {dialog.status === 'open' && dialog.kind === 'onConfirm' && (
        <ConfirmDialog
          variant="confirm"
          open={isDialogOpen}
          dispatch={dispatch}
          onConfirm={() => setIsDialogOpen(false)}
          title="전체 알림이 삭제되었습니다."
        />
      )}
    </>
  );
}
