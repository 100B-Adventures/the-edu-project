import type { ShellMessage } from '@/entities/shell/types';

const TEMPLATE_TEXT: Record<string, string> = {
  DOING_WELL: '잘하고 있어요',
  SEE_YOU_TOMORROW: '내일 또 봐요',
  ANSWERED_QUESTION: '질문에 답했어요',
};

/** 받은 메시지 문구. 직접 쓴 메시지는 본문, 템플릿은 정해진 문구. */
export const messageText = (message: ShellMessage): string =>
  message.templateCode === 'CUSTOM'
    ? (message.body ?? '')
    : (TEMPLATE_TEXT[message.templateCode] ?? message.body ?? '');
