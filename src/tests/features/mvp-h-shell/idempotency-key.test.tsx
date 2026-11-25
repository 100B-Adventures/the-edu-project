import { QuickMessage } from '@/features/teaching-lesson/components/student-detail/quick-message';
import { NoticeList } from '@/features/study-rooms/components/office/notice-list';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  ids: ['one', 'two', 'three', 'four'],
  createNotice: vi.fn(),
  sendMessage: vi.fn(),
}));

vi.mock('@/shared/lib/create-id', () => ({
  createId: () => mocks.ids.shift(),
}));

vi.mock('@/features/app-shell/hooks/use-shell-queries', () => ({
  useNoticesQuery: () => ({
    data: [],
    error: null,
    isError: false,
    isPending: false,
    refetch: vi.fn(),
  }),
  useNoticeMutations: () => ({
    create: { mutate: mocks.createNotice, isPending: false },
    update: { mutate: vi.fn(), isPending: false },
    remove: { mutate: vi.fn(), isPending: false },
  }),
  useSentMessagesQuery: () => ({ data: [] }),
  useSendMessageMutation: () => ({
    mutate: mocks.sendMessage,
    isPending: false,
  }),
}));

describe('N-3 입력 폼 멱등 키 생명주기', () => {
  beforeEach(() => {
    mocks.ids = ['one', 'two', 'three', 'four'];
    mocks.createNotice.mockReset();
    mocks.sendMessage.mockReset();
  });

  it('빠른 피드백은 실패 재전송에 같은 키를 쓰고 성공 뒤 새 키를 쓴다', () => {
    mocks.sendMessage
      .mockImplementationOnce((_: unknown, options: { onError: () => void }) => options.onError())
      .mockImplementationOnce((_: unknown, options: { onSuccess: () => void }) => options.onSuccess());
    render(<QuickMessage studentId={5} roomId={10} />);

    fireEvent.click(screen.getByRole('button', { name: '잘하고 있어요' }));
    fireEvent.click(screen.getByRole('button', { name: '잘하고 있어요' }));
    fireEvent.click(screen.getByRole('button', { name: '잘하고 있어요' }));

    expect(mocks.sendMessage.mock.calls[0]?.[0].idempotencyKey).toBe('message-one');
    expect(mocks.sendMessage.mock.calls[1]?.[0].idempotencyKey).toBe('message-one');
    expect(mocks.sendMessage.mock.calls[2]?.[0].idempotencyKey).toBe('message-two');
  });

  it('공지 폼도 실패 재전송에 같은 키를 쓰고 성공 뒤 새 키를 쓴다', () => {
    mocks.createNotice
      .mockImplementationOnce((_: unknown, options: { onError: () => void }) => options.onError())
      .mockImplementationOnce((_: unknown, options: { onSuccess: () => void }) => options.onSuccess());
    render(<NoticeList roomId={10} role="teacher" />);
    const title = screen.getByLabelText('공지 제목');
    const body = screen.getByLabelText('공지 내용');
    const submit = screen.getByRole('button', { name: '공지 올리기' });

    fireEvent.change(title, { target: { value: '제목' } });
    fireEvent.change(body, { target: { value: '본문' } });
    fireEvent.click(submit);
    fireEvent.click(submit);
    fireEvent.change(title, { target: { value: '새 제목' } });
    fireEvent.change(body, { target: { value: '새 본문' } });
    fireEvent.click(submit);

    expect(mocks.createNotice.mock.calls[0]?.[0].idempotencyKey).toBe('notice-one');
    expect(mocks.createNotice.mock.calls[1]?.[0].idempotencyKey).toBe('notice-one');
    expect(mocks.createNotice.mock.calls[2]?.[0].idempotencyKey).toBe('notice-two');
  });
});
