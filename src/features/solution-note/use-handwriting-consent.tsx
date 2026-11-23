'use client';

import { useCallback, useRef, useState } from 'react';

import { handwritingRepository } from '@/entities/handwriting';
import { showBottomToast } from '@/shared/components/ui';

import { HandwritingConsentDialog } from './components/handwriting-consent-dialog';

export const HANDWRITING_CONSENT_TYPE = 'HANDWRITING_STORE';

/**
 * 손필기 저장 동의를 업로드보다 먼저 확인한다(D-128).
 * ensureConsent 는 이미 동의했으면 바로 true, 아니면 창을 열어 묻고 동의하면 기록한 뒤 true,
 * "나중에" 이거나 기록에 실패하면 false 를 돌려준다(실패는 안내 문구로 알린다).
 * 창이 이미 떠 있으면 같은 질문을 같이 기다린다(두 번째 창이 첫 번째 약속을 덮어쓰지 않는다).
 */
export const useHandwritingConsent = () => {
  const resolverRef = useRef<((agreed: boolean) => void) | null>(null);
  const askingRef = useRef<Promise<boolean> | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const ask = useCallback((): Promise<boolean> => {
    if (askingRef.current) return askingRef.current;
    const promise = new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setIsOpen(true);
    }).finally(() => {
      askingRef.current = null;
    });
    askingRef.current = promise;
    return promise;
  }, []);

  const ensureConsent = useCallback(
    async (force = false): Promise<boolean> => {
      if (!force) {
        try {
          const status = await handwritingRepository.getConsent(
            HANDWRITING_CONSENT_TYPE
          );
          if (status.granted) return true;
        } catch {
          // 상태를 못 읽으면 학생에게 직접 묻는다.
        }
      }
      const agreed = await ask();
      if (!agreed) {
        setIsOpen(false);
        return false;
      }
      try {
        await handwritingRepository.grantConsent(HANDWRITING_CONSENT_TYPE);
        return true;
      } catch {
        showBottomToast('동의를 저장하지 못했어요. 다시 시도해 주세요.');
        return false;
      } finally {
        setIsPending(false);
        setIsOpen(false);
      }
    },
    [ask]
  );

  const consentDialog = (
    <HandwritingConsentDialog
      isOpen={isOpen}
      isPending={isPending}
      onAgree={() => {
        setIsPending(true);
        resolverRef.current?.(true);
      }}
      onDecline={() => {
        setIsOpen(false);
        resolverRef.current?.(false);
      }}
    />
  );

  return { ensureConsent, consentDialog };
};
