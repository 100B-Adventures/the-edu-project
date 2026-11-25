'use client';

import { useState } from 'react';

import { type ShellMessage, messageText } from '@/entities/shell';
import { Button } from '@/shared/components/ui/button';

const SUMMARY_COUNT = 3;

/** 선생님이 보낸 것. 최대 3건을 보이고 더 있으면 "전체 보기"로 그 자리에서 펼친다. 0건이면 자리가 없다. */
export const ReceivedList = ({ items }: { items: ShellMessage[] }) => {
  const [expanded, setExpanded] = useState(false);
  if (items.length === 0) return null;
  const visible = expanded ? items : items.slice(0, SUMMARY_COUNT);

  return (
    <section
      aria-label="받은 것"
      className="border-line-line1 rounded-card p-card-pad gap-content-gap flex flex-col border bg-white"
    >
      <h2 className="font-body2-heading text-text-main">받은 것</h2>
      <ul className="gap-content-gap flex flex-col">
        {visible.map((message) => (
          <li
            key={message.id}
            className="font-body2-normal text-gray-10 text-two-lines"
          >
            {messageText(message)}
          </li>
        ))}
      </ul>
      {!expanded && items.length > SUMMARY_COUNT && (
        <Button
          variant="ghost"
          size="compact"
          onClick={() => setExpanded(true)}
        >
          전체 보기
        </Button>
      )}
    </section>
  );
};
