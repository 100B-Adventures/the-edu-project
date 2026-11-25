import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { ScreenState } from './screen-state';

const meta = {
  title: 'Common/Feedback/ScreenState',
  component: ScreenState,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-96 max-w-full">
        <Story />
      </div>
    ),
  ],
  args: { status: 'ready', children: <div>불러온 화면 내용</div> },
} satisfies Meta<typeof ScreenState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};
export const Loading: Story = { args: { status: 'loading' } };
export const Empty: Story = {
  args: {
    status: 'empty',
    empty: {
      title: '아직 기록이 없어요',
      description: '첫 노트를 올리면 여기에 쌓여요.',
    },
  },
};
export const Error: Story = {
  args: { status: 'error', error: { onRetry: fn() } },
};
export const Forbidden: Story = {
  args: {
    status: 'forbidden',
    forbidden: { title: '이 방의 구성원만 볼 수 있어요' },
  },
};
export const Offline: Story = { args: { status: 'offline' } };
