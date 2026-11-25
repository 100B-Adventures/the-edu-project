import type { Meta, StoryObj } from '@storybook/react';

import { ReflectionItem } from './reflection-item';

const meta = {
  title: 'Common/UI/ReflectionItem',
  component: ReflectionItem,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <ul className="w-96 max-w-full">
        <Story />
      </ul>
    ),
  ],
  args: {
    dateLabel: '11월 24일',
    mood: 'FOCUSED',
    text: '오늘은 풀이 순서를 먼저 적으니 덜 막혔다.',
  },
} satisfies Meta<typeof ReflectionItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Focused: Story = {};
export const Okay: Story = { args: { mood: 'OKAY' } };
export const Tired: Story = { args: { mood: 'TIRED' } };
export const EmptyText: Story = { args: { mood: null, text: null } };
export const LongText: Story = {
  args: {
    text: '긴 회고가 들어와도 목록 전체 높이가 과도하게 늘지 않도록 두 줄에서 정리되는지 확인합니다. 같은 문장을 한 번 더 이어서 말줄임 상태도 함께 봅니다.',
  },
};
