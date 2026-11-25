import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { SegmentedTabs } from './segmented-tabs';

const items = [
  { id: 'week', label: '주간', badge: 2 },
  { id: 'month', label: '월간' },
  { id: 'total', label: '전체' },
];

const meta = {
  title: 'Common/UI/SegmentedTabs',
  component: SegmentedTabs,
  parameters: { layout: 'centered' },
  args: { items, value: 'week', ariaLabel: '기간', onChange: fn() },
} satisfies Meta<typeof SegmentedTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pill: Story = {};
export const Underline: Story = { args: { variant: 'underline' } };
export const LinkTabs: Story = {
  args: {
    items: items.map((item) => ({
      ...item,
      href: `/performance?period=${item.id}`,
    })),
  },
};
export const Many: Story = {
  args: {
    items: Array.from({ length: 12 }, (_, index) => ({
      id: String(index),
      label: `${index + 1}번째 탭`,
    })),
    value: '0',
  },
};
