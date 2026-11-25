'use client';

import { useState } from 'react';

import { ReflectionItem } from '@/shared/components/reflection-item/reflection-item';
import { Button } from '@/shared/components/ui/button';

type ReflectionRow = {
  id: number;
  dateLabel: string;
  mood?: 'TIRED' | 'OKAY' | 'FOCUSED' | null;
  text?: string | null;
};

const FIRST_COUNT = 3;

/** 이번 주 회고 목록. 처음엔 3개, "이전 회고 더 보기"로 그 자리에서 펼친다. 0건이면 칸이 없다. */
export const ReflectionList = ({ items }: { items: ReflectionRow[] }) => {
  const [expanded, setExpanded] = useState(false);
  if (items.length === 0) return null;
  const visible = expanded ? items : items.slice(0, FIRST_COUNT);

  return (
    <section
      aria-label="이번 주 회고"
      className="gap-content-gap flex flex-col"
    >
      <h2 className="font-body2-heading text-text-main">이번 주 회고</h2>
      <ul className="gap-row-gap flex flex-col">
        {visible.map((item) => (
          <ReflectionItem
            key={item.id}
            dateLabel={item.dateLabel}
            mood={item.mood}
            text={item.text}
          />
        ))}
      </ul>
      {!expanded && items.length > FIRST_COUNT && (
        <Button
          variant="ghost"
          size="compact"
          onClick={() => setExpanded(true)}
        >
          이전 회고 더 보기
        </Button>
      )}
    </section>
  );
};
