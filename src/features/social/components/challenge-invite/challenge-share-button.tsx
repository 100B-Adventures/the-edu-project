'use client';

import { useState } from 'react';

import { type ChallengeInvite } from '@/entities/social';
import { Button, Dialog, showBottomToast } from '@/shared/components/ui';
import { PUBLIC } from '@/shared/constants';
import { trackOcInviteSent } from '@/shared/lib/analytics';
import { Check, Copy, Swords } from 'lucide-react';

import { useCreateChallengeInviteMutation } from '../../hooks';

type ChallengeShareButtonProps = {
  challengeId: number;
  variant?: 'primary' | 'secondary' | 'outlined';
  size?: 'large' | 'medium' | 'small' | 'xsmall';
  className?: string;
  label?: string;
};

/* ─────────────────────────────────────────────────────
 * "도전장 보내기" 버튼 + 공유 다이얼로그
 *  - 클릭 시 shareToken 발급(POST) → 공유 링크 표시 + 복사
 * ────────────────────────────────────────────────────*/
export const ChallengeShareButton = ({
  challengeId,
  variant = 'secondary',
  size = 'small',
  className,
  label = '도전장 보내기',
}: ChallengeShareButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [invite, setInvite] = useState<ChallengeInvite | null>(null);
  const [copied, setCopied] = useState(false);

  const { mutate, isPending, isError, reset } =
    useCreateChallengeInviteMutation();

  const shareUrl =
    invite && typeof window !== 'undefined'
      ? `${window.location.origin}${PUBLIC.CORE.INVITE.CHALLENGE(invite.shareToken)}`
      : '';

  const handleOpen = () => {
    setIsOpen(true);
    setInvite(null);
    setCopied(false);
    reset();
    mutate(
      { challengeId },
      {
        onSuccess: (created) => {
          setInvite(created);
          // D2 계측: oc_invite_sent
          trackOcInviteSent({ problem_id: challengeId });
        },
      }
    );
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showBottomToast('도전장 링크를 복사했어요.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showBottomToast('복사에 실패했어요. 링크를 직접 선택해 주세요.');
    }
  };

  // Web Share API 지원 브라우저(대부분 모바일)면 카카오톡·문자 등 네이티브 공유 시트를 띄운다.
  // 미지원(대부분 데스크톱)이면 기존 클립보드 복사로 폴백한다.
  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleNativeShare = async () => {
    if (!shareUrl) return;
    try {
      await navigator.share({
        title: '도전장이 도착했어요',
        text: '이 문제, 나랑 겨뤄볼래?',
        url: shareUrl,
      });
      trackOcInviteSent({ problem_id: challengeId });
    } catch {
      // 사용자가 공유 시트를 취소한 경우 등 — 별도 에러 토스트 없이 조용히 무시한다.
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleOpen}
      >
        <Swords
          size={18}
          className="mr-1.5 shrink-0"
        />
        {label}
      </Button>

      <Dialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      >
        <Dialog.Content className="max-w-110 gap-5">
          <Dialog.Header>
            <Dialog.Title className="font-headline2-heading">
              도전장 보내기
            </Dialog.Title>
            <Dialog.Description className="font-body2-normal text-text-sub1">
              친구에게 같은 문제를 풀어보라고 링크를 보내요. 누가 더 잘 푸는지
              겨뤄봐요.
            </Dialog.Description>
          </Dialog.Header>

          <Dialog.Body className="gap-4">
            {isPending && (
              <div className="bg-gray-1 rounded-button h-12 w-full animate-pulse" />
            )}

            {isError && (
              <p className="font-body2-normal text-system-warning">
                도전장 링크를 만들지 못했어요. 잠시 후 다시 시도해 주세요.
              </p>
            )}

            {invite && (
              <>
                <div className="flex items-stretch gap-2">
                  <div className="border-line-line2 bg-gray-1 rounded-button flex min-w-0 flex-1 items-center border px-3">
                    <span
                      data-clarity-mask="true"
                      className="font-caption-normal text-text-sub1 truncate"
                    >
                      {shareUrl}
                    </span>
                  </div>
                  <Button
                    size="small"
                    variant="primary"
                    className="shrink-0"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check
                        size={18}
                        className="mr-1 shrink-0"
                      />
                    ) : (
                      <Copy
                        size={18}
                        className="mr-1 shrink-0"
                      />
                    )}
                    {copied ? '복사됨' : '복사'}
                  </Button>
                </div>
                {canNativeShare && (
                  <Button
                    size="small"
                    variant="secondary"
                    className="w-full"
                    onClick={handleNativeShare}
                  >
                    💬 카카오톡·문자로 바로 보내기
                  </Button>
                )}
              </>
            )}
          </Dialog.Body>

          <Dialog.Footer className="justify-end">
            <Dialog.Close asChild>
              <Button
                variant="outlined"
                size="small"
                onClick={handleClose}
              >
                닫기
              </Button>
            </Dialog.Close>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </>
  );
};
