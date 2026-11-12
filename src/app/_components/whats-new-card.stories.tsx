import type { Meta, StoryObj } from '@storybook/react';

import { WhatsNewCardView } from './whats-new-card';

const note = {
  version: 'v2.0.22',
  date: '2026-11-12',
  title: '업데이트 소식을 한눈에 확인해요',
  body: [
    '새 기능과 개선 내용을 업데이트 소식 화면에서 확인할 수 있어요.',
    '새로운 기능 카드에서 바로 써 보고 의견을 남길 수 있어요.',
  ],
  notify: true,
  try_href: '/updates',
};

const meta = {
  title: 'Common/Feedback/WhatsNewCard',
  component: WhatsNewCardView,
  parameters: { layout: 'fullscreen' },
  args: {
    note,
    feedback: null,
    onDismiss: () => undefined,
    onFeedback: () => undefined,
    onTry: () => undefined,
  },
} satisfies Meta<typeof WhatsNewCardView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FeedbackSubmitted: Story = {
  args: { feedback: 'like' },
};
