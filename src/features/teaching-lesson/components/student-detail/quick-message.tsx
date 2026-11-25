'use client';

import { useState } from 'react';

import {
  useSendMessageMutation,
  useSentMessagesQuery,
} from '@/features/app-shell/hooks/use-shell-queries';
import { messageText } from '@/features/today/components/received-list';
import { Button, Textarea, showBottomToast } from '@/shared/components/ui';

const TEMPLATES = [
  { code: 'DOING_WELL', label: '잘하고 있어요' },
  { code: 'SEE_YOU_TOMORROW', label: '내일 또 봐요' },
  { code: 'ANSWERED_QUESTION', label: '질문에 답했어요' },
] as const;

const CUSTOM_MAX = 300;

type QuickMessageProps = { studentId: number; roomId: number };

/** 빠른 피드백. 템플릿 셋은 한 번에 보내고, 직접 쓰기는 비면 보내기가 막힌다(서버도 400). */
export const QuickMessage = ({ studentId, roomId }: QuickMessageProps) => {
  const [custom, setCustom] = useState('');
  const sentQuery = useSentMessagesQuery(studentId, roomId);
  const send = useSendMessageMutation(studentId);
  const sent = sentQuery.data ?? [];
  const trimmed = custom.trim();

  const submit = (templateCode: string, body?: string) =>
    send.mutate(
      { roomId, templateCode, body: body ?? null },
      {
        onSuccess: () => {
          setCustom('');
          showBottomToast('피드백을 보냈어요');
        },
        onError: () =>
          showBottomToast('보내지 못했어요. 잠시 뒤에 다시 해 주세요'),
      }
    );

  return (
    <section
      aria-label="빠른 피드백"
      className="border-line-line1 rounded-card p-card-pad gap-block-gap flex flex-col border bg-white"
    >
      <h2 className="font-body2-heading text-text-main">빠른 피드백</h2>
      <div className="gap-content-gap flex flex-wrap">
        {TEMPLATES.map((template) => (
          <Button
            key={template.code}
            variant="outlined"
            size="chip"
            disabled={send.isPending}
            onClick={() => submit(template.code)}
          >
            {template.label}
          </Button>
        ))}
      </div>
      <Textarea
        value={custom}
        maxLength={CUSTOM_MAX}
        onChange={(event) => setCustom(event.target.value)}
        placeholder="직접 쓰기"
        aria-label="직접 쓰는 피드백"
      />
      <Button
        size="small"
        disabled={!trimmed || send.isPending}
        onClick={() => submit('CUSTOM', trimmed)}
      >
        보내기
      </Button>
      {sent.length > 0 && (
        <div className="gap-inline-gap flex flex-col">
          <p className="font-caption-heading text-orange-11">피드백 보냄</p>
          <ul className="gap-inline-gap flex flex-col">
            {sent.slice(0, 5).map((message) => (
              <li
                key={message.id}
                className="font-body2-normal text-gray-10 text-single-line"
              >
                {messageText(message)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
