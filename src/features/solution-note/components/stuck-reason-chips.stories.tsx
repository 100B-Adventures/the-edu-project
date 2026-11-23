import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { StuckReasonChips } from './stuck-reason-chips';

const meta = {
  title: '오독공/Form/StuckReasonChips',
  component: StuckReasonChips,
  parameters: { layout: 'padded' },
  args: { selected: [], onToggle: () => {} },
} satisfies Meta<typeof StuckReasonChips>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 기본: 아무것도 고르지 않은 상태 */
export const Empty: Story = {};

export const Selected: Story = {
  args: { selected: ['TOOK_LONG', 'CONCEPT_GAP'] },
};

export const AllSelected: Story = {
  args: {
    selected: [
      'TOOK_LONG',
      'NO_APPROACH',
      'NOT_FINISHED',
      'CONCEPT_GAP',
      'STOPPED_MIDWAY',
      'EXPL_HARD',
      'CORRECT_BUT_AGAIN',
    ],
  },
};

/** 저장 중에는 누를 수 없다 */
export const Disabled: Story = {
  args: { selected: ['NO_APPROACH'], disabled: true },
};

/** 눌러 보며 확인하는 상태 있는 예 */
export const Interactive: Story = {
  render: (args) => {
    const [selected, setSelected] = useState<string[]>([]);
    return (
      <StuckReasonChips
        {...args}
        selected={selected}
        onToggle={(code) =>
          setSelected((prev) =>
            prev.includes(code)
              ? prev.filter((c) => c !== code)
              : [...prev, code]
          )
        }
      />
    );
  },
};
