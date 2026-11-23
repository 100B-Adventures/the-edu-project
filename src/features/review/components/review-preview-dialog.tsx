'use client';

import { useState } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { solutionNoteRepository } from '@/entities/solution-note';
import type { ReviewCard } from '@/entities/wrong-answer';
import { Button, Dialog } from '@/shared/components/ui';
import { PRIVATE } from '@/shared/constants';

import { STUCK_REASON_LABEL } from '../review-labels';

type ReviewPreviewDialogProps = {
  card: ReviewCard | null;
  onClose: () => void;
};

/** 시안 review.html `#pv` 미리보기 시트: 해설 없이 다시 풀기 · 예전 풀이 보기 */
export const ReviewPreviewDialog = ({
  card,
  onClose,
}: ReviewPreviewDialogProps) => {
  const router = useRouter();
  const [noHistory, setNoHistory] = useState(false);

  const handleClose = () => {
    setNoHistory(false);
    onClose();
  };

  const handleBlank = () => {
    if (!card) return;
    router.push(PRIVATE.DASHBOARD.STUDENT_REVIEW_BLANK(card.wrongAnswerId));
  };

  const handleHistory = async () => {
    if (!card?.challengeId) {
      setNoHistory(true);
      return;
    }
    const history = await solutionNoteRepository.getHistory(card.challengeId);
    const latest = history.items[0];
    if (!latest) {
      setNoHistory(true);
      return;
    }
    router.push(PRIVATE.DASHBOARD.SOLUTION_NOTE(latest.solutionNoteId));
  };

  return (
    <Dialog
      isOpen={card !== null}
      onOpenChange={(open) => !open && handleClose()}
    >
      <Dialog.Content className="max-w-dialog-sm gap-4 p-card-pad">
        <Dialog.Header>
          <Dialog.Title>{card?.title ?? '문제'}</Dialog.Title>
          <Dialog.Description className="text-text-sub1 font-body2-normal">
            {card?.reasons
              .map((code) => STUCK_REASON_LABEL[code] ?? code)
              .join(' · ')}
          </Dialog.Description>
        </Dialog.Header>
        <Dialog.Body className="gap-3">
          {card?.thumbUrl && (
            <span className="bg-gray-1 rounded-card relative block h-48 w-full overflow-hidden">
              <Image
                src={card.thumbUrl}
                alt="내 마지막 풀이"
                fill
                unoptimized
                className="object-cover object-top-left"
              />
            </span>
          )}
          {noHistory && (
            <p className="font-body2-normal text-text-sub1">
              예전 풀이가 없어요.
            </p>
          )}
        </Dialog.Body>
        <Dialog.Footer className="flex-col">
          <Button
            size="large"
            onClick={handleBlank}
            data-testid="review-preview-blank"
          >
            해설 없이 다시 풀기
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => void handleHistory()}
            data-testid="review-preview-history"
          >
            예전 풀이 보기
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};
