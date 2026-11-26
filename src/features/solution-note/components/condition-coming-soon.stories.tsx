import type { Meta, StoryObj } from '@storybook/react';

import { ConditionComingSoon } from './condition-coming-soon';

const meta = {
  title: 'MVP-H/SolutionNote/ConditionComingSoon',
  component: ConditionComingSoon,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ConditionComingSoon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
