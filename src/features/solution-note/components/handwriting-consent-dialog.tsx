'use client';

import { Button, Dialog } from '@/shared/components/ui';

type HandwritingConsentDialogProps = {
  isOpen: boolean;
  isPending: boolean;
  onAgree: () => void;
  onDecline: () => void;
};

/**
 * 손필기 저장 동의 확인 창. 임시 화면이다.
 * 최종 디자인은 FDD §13 G-A 로 디자인 단계에 돌려보낸다(이 창의 문구·모양은 확정이 아니다).
 */
export const HandwritingConsentDialog = ({
  isOpen,
  isPending,
  onAgree,
  onDecline,
}: HandwritingConsentDialogProps) => (
  <Dialog
    isOpen={isOpen}
    onOpenChange={(open) => !open && !isPending && onDecline()}
  >
    <Dialog.Content
      className="max-w-dialog-sm gap-4 p-card-pad"
      data-testid="consent-dialog"
    >
      <Dialog.Header>
        <Dialog.Title>손글씨를 저장할까요</Dialog.Title>
        <Dialog.Description className="text-text-sub1 font-body2-normal">
          풀이노트에서 내 손글씨를 다시 보려면 저장에 동의해야 해요.
        </Dialog.Description>
      </Dialog.Header>
      <div className="flex gap-2">
        <Button
          variant="outlined"
          className="flex-1"
          disabled={isPending}
          onClick={onDecline}
          data-testid="consent-decline"
        >
          나중에
        </Button>
        <Button
          className="flex-1"
          isLoading={isPending}
          onClick={onAgree}
          data-testid="consent-agree"
        >
          동의하고 저장
        </Button>
      </div>
    </Dialog.Content>
  </Dialog>
);
