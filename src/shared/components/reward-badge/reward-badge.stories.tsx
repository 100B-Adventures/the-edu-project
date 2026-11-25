import type { Meta, StoryObj } from '@storybook/react';

import { RewardBadge } from './reward-badge';

const meta = {
  title: 'Common/Feedback/RewardBadge',
  component: RewardBadge,
  parameters: { layout: 'centered' },
  args: { kind: 'exp', amount: 10, state: 'pending' },
} satisfies Meta<typeof RewardBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PendingExp: Story = {};
export const EarnedExp: Story = { args: { state: 'earned' } };
export const CappedExp: Story = { args: { state: 'capped' } };
export const PointCost: Story = { args: { kind: 'point', amount: 30 } };
