import type { Meta, StoryObj } from '@storybook/react';

import { RoomCard } from './room-card';

const meta = {
  title: 'Common/Layout/RoomCard',
  component: RoomCard,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-96 max-w-full">
        <Story />
      </div>
    ),
  ],
  args: {
    name: '오독공 수학 교무실',
    teacherName: '정성진',
    memberCounts: { teacher: 1, student: 8 },
    noteCount: 34,
    lectureCount: 6,
  },
} satisfies Meta<typeof RoomCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Office: Story = {};
export const Row: Story = { args: { variant: 'row' } };
export const Chip: Story = { args: { variant: 'chip' } };
export const SelectedChip: Story = {
  args: { variant: 'chip', selected: true },
};
export const Minimal: Story = {
  args: {
    teacherName: null,
    memberCounts: undefined,
    noteCount: undefined,
    lectureCount: undefined,
  },
};
export const LongName: Story = {
  args: { name: '아주 긴 이름을 가진 고등학교 수학 집중 학습 교무실' },
};
