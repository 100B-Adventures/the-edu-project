import type { Meta, StoryObj } from '@storybook/react';

import { NoteCard } from './note-card';

const meta = {
  title: 'Common/UI/NoteCard',
  component: NoteCard,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
  args: {
    kind: 'concept',
    title: '수학적 귀납법',
    pageCount: 6,
    updatedLabel: '11월 24일',
  },
} satisfies Meta<typeof NoteCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ConceptCover: Story = {};
export const SolutionCover: Story = { args: { kind: 'solution' } };
export const FreeCover: Story = { args: { kind: 'free' } };
export const Row: Story = { args: { density: 'row' } };
export const EmptySlot: Story = {
  args: { slot: 'empty', title: '아직 쓴 노트가 없어요' },
};
export const LongTitle: Story = {
  args: {
    title: '아주 긴 단원 이름이 들어와도 카드 너비를 밀어내지 않는 노트 제목',
  },
};
