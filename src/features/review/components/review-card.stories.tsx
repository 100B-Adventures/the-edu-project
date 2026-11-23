import type { ReviewCard as ReviewCardData } from '@/entities/wrong-answer';
import type { Meta, StoryObj } from '@storybook/react';

import { ReviewCard } from './review-card';

const base: ReviewCardData = {
  wrongAnswerId: 1,
  challengeId: 4006,
  title: '등차수열의 합',
  unitName: '수열',
  thumbUrl: null,
  reasons: ['CONCEPT_GAP'],
  reasonText: null,
  dueBadge: { kind: 'DUE_NOW', label: '지금' },
  reviewCount: 1,
  maxReviews: 5,
  lastReviewedAt: null,
  origin: null,
};

const meta = {
  title: '오독공/UI/ReviewCard',
  component: ReviewCard,
  parameters: { layout: 'centered' },
  args: { card: base, onOpen: () => {} },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ReviewCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 기본: 지금 풀 차례 */
export const DueNow: Story = {};

export const Tomorrow: Story = {
  args: { card: { ...base, dueBadge: { kind: 'TOMORROW', label: '내일' } } },
};

export const DayAfter: Story = {
  args: { card: { ...base, dueBadge: { kind: 'DAY_AFTER', label: '모레' } } },
};

export const Later: Story = {
  args: {
    card: {
      ...base,
      dueBadge: { kind: 'LATER', label: '다음 주' },
      reviewCount: 3,
    },
  },
};

/** 빈 상태: 제목·이유가 없는 카드 */
export const NoTitleNoReason: Story = {
  args: { card: { ...base, title: null, unitName: null, reasons: [] } },
};

/** 긴 제목은 줄여 보인다 */
export const LongTitle: Story = {
  args: {
    card: {
      ...base,
      title:
        '아주 긴 제목의 문제입니다 아주 긴 제목의 문제입니다 아주 긴 제목의 문제입니다',
      reasons: ['TOOK_LONG', 'NO_APPROACH', 'CONCEPT_GAP'],
    },
  },
};
