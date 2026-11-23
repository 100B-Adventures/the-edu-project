import type { Meta, StoryObj } from '@storybook/react';

import { HandwritingConsentDialog } from './handwriting-consent-dialog';

const meta = {
  title: '오독공/Feedback/HandwritingConsentDialog',
  component: HandwritingConsentDialog,
  parameters: { layout: 'centered' },
  args: {
    isOpen: true,
    isPending: false,
    onAgree: () => {},
    onDecline: () => {},
  },
} satisfies Meta<typeof HandwritingConsentDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 기본: 열린 동의 창 */
export const Open: Story = {};

/** 동의를 기록하는 중(버튼 로딩, 닫기 막힘) */
export const Pending: Story = { args: { isPending: true } };

/** 닫힌 상태에서는 아무것도 그리지 않는다 */
export const Closed: Story = { args: { isOpen: false } };
