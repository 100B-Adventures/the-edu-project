import type { Meta, StoryObj } from '@storybook/react';

import { EditShell } from './edit-shell';

const meta = {
  title: 'MVP-H/EditShell/Common',
  component: EditShell,
  args: {
    children: (
      <div className="border-line-line1 rounded-card p-card-pad min-h-96 border bg-white">
        필기 판
      </div>
    ),
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof EditShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
