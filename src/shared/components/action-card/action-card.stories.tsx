import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { RewardBadge } from '../reward-badge/reward-badge';
import { ActionCard } from './action-card';

const meta = {
  title: 'Common/Layout/ActionCard',
  component: ActionCard,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-96 max-w-full">
        <Story />
      </div>
    ),
  ],
  args: {
    eyebrow: '오늘 할 일 하나',
    title: '함수 과제를 마무리해요',
    subtitle: '선생님이 준 할 일이에요',
    cta: { label: '다 했어요', onClick: fn() },
  },
} satisfies Meta<typeof ActionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Card: Story = {};
export const Line: Story = { args: { variant: 'line' } };
export const Done: Story = { args: { state: 'done', cta: { label: '완료' } } };
export const SoftLate: Story = {
  args: { state: 'soft-late', due: '이번 주에 천천히 마쳐요' },
};
export const Disabled: Story = {
  args: { cta: { label: '처리 중', disabled: true } },
};
export const WithReward: Story = {
  args: {
    reward: (
      <RewardBadge
        kind="exp"
        amount={10}
      />
    ),
  },
};
export const LongContent: Story = {
  args: {
    title:
      '한 화면에서 두 줄이 넘어갈 수 있는 아주 긴 오늘의 할 일 제목을 확인해요',
    subtitle:
      '설명도 길어졌을 때 행동 버튼과 겹치지 않고 두 줄에서 정리되는지 보는 상태입니다.',
  },
};
