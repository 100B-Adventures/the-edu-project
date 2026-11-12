'use client';

import { useEffect, useRef, useState } from 'react';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import { Button } from '@/shared/components/ui';
import { GA4_EVENTS, track } from '@/shared/lib/analytics';
import { isTokenBearingUrl } from '@/shared/lib/analytics/ad-pixels';
import {
  CURRENT_PUBLIC_RELEASE_NOTE,
  type PublicReleaseNote,
} from '@/shared/lib/release-notes';
import { ThumbsDown, ThumbsUp, X } from 'lucide-react';

export const LAST_SEEN_VERSION_KEY = 'last_seen_version';

const BLOCKED_PATHS = [
  '/login',
  '/register',
  '/welcome',
  '/onboarding',
  '/select-role',
  '/admin',
];

const underPath = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(`${base}/`);

export const isWhatsNewBlockedRoute = (
  pathname: string,
  search = ''
) =>
  BLOCKED_PATHS.some((base) => underPath(pathname, base)) ||
  isTokenBearingUrl(pathname, search);

export const shouldShowWhatsNew = ({
  note,
  lastSeenVersion,
  pathname,
  search = '',
}: {
  note: PublicReleaseNote | undefined;
  lastSeenVersion: string | null;
  pathname: string;
  search?: string;
}) =>
  Boolean(
    note?.notify &&
      note.version !== lastSeenVersion &&
      !isWhatsNewBlockedRoute(pathname, search)
  );

type FeedbackValue = 'like' | 'dislike';

export function WhatsNewCardView({
  note,
  feedback,
  onDismiss,
  onFeedback,
  onTry,
}: {
  note: PublicReleaseNote;
  feedback: FeedbackValue | null;
  onDismiss: () => void;
  onFeedback: (value: FeedbackValue) => void;
  onTry: () => void;
}) {
  return (
    <section
      aria-label="새로운 기능"
      className="border-line-line1 shadow-popover rounded-card p-card-pad fixed right-section-gap-mobile bottom-section-gap-mobile left-section-gap-mobile z-(--z-layer-notification) border bg-white tablet:right-section-gap tablet:bottom-section-gap tablet:left-auto tablet:w-full tablet:max-w-dialog"
      data-testid="whats-new-card"
    >
      <div className="mb-content-gap flex items-start justify-between gap-content-gap">
        <div className="min-w-0">
          <p className="font-caption-heading text-key-color-primary mb-inline-gap">
            새로운 기능 · {note.version}
          </p>
          <h2 className="font-headline2-heading text-text-main break-keep">
            {note.title}
          </h2>
        </div>
        <Button
          aria-label="새로운 기능 카드 닫기"
          className="shrink-0"
          onClick={onDismiss}
          size="icon"
          variant="ghost"
        >
          <X aria-hidden="true" className="size-5" />
        </Button>
      </div>

      <div className="font-body2-normal text-text-sub2 mb-section-gap space-y-content-gap break-keep">
        {note.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      <Button asChild className="w-full" size="compact">
        <Link href={note.try_href} onClick={onTry}>
          써 보기
        </Link>
      </Button>

      <div className="border-line-line1 mt-section-gap border-t pt-section-gap">
        <p className="font-caption-heading text-text-sub2 mb-content-gap">
          의견 남기기
        </p>
        {feedback ? (
          <p className="font-body2-normal text-system-success-text" role="status">
            의견을 남겼어요. 다음 개선에 반영할게요.
          </p>
        ) : (
          <div className="flex gap-target-gap">
            <Button
              className="min-w-0 flex-1 gap-inline-gap"
              onClick={() => onFeedback('like')}
              size="compact"
              variant="outlined"
            >
              <ThumbsUp aria-hidden="true" className="size-4" />
              좋아요
            </Button>
            <Button
              className="min-w-0 flex-1 gap-inline-gap"
              onClick={() => onFeedback('dislike')}
              size="compact"
              variant="outlined"
            >
              <ThumbsDown aria-hidden="true" className="size-4" />
              별로예요
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

export function WhatsNewCard({
  note = CURRENT_PUBLIC_RELEASE_NOTE,
}: {
  note?: PublicReleaseNote;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const trackedVersionRef = useRef<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackValue | null>(null);

  useEffect(() => {
    if (!note) return;

    let lastSeenVersion: string | null = null;
    try {
      lastSeenVersion = localStorage.getItem(LAST_SEEN_VERSION_KEY);
    } catch {
      // 저장소 접근이 차단돼도 현재 화면에서는 알림을 보여 준다.
    }

    if (
      !shouldShowWhatsNew({
        note,
        lastSeenVersion,
        pathname,
        search,
      })
    ) {
      setVisible(false);
      return;
    }

    setVisible(true);
    setFeedback(null);

    try {
      localStorage.setItem(LAST_SEEN_VERSION_KEY, note.version);
    } catch {
      // 저장소 접근이 차단돼도 이번 화면에서는 중복 추적하지 않는다.
    }

    if (trackedVersionRef.current !== note.version) {
      trackedVersionRef.current = note.version;
      track(GA4_EVENTS.WHATS_NEW_VIEW, { version: note.version });
    }
  }, [note, pathname, search]);

  if (!note || !visible) return null;

  const dismiss = () => {
    setVisible(false);
    track(GA4_EVENTS.WHATS_NEW_DISMISS, { version: note.version });
  };

  const leaveFeedback = (value: FeedbackValue) => {
    setFeedback(value);
    track(GA4_EVENTS.WHATS_NEW_FEEDBACK, {
      version: note.version,
      value,
    });
  };

  const tryFeature = () => {
    track(GA4_EVENTS.WHATS_NEW_TRY, { version: note.version });
  };

  return (
    <WhatsNewCardView
      feedback={feedback}
      note={note}
      onDismiss={dismiss}
      onFeedback={leaveFeedback}
      onTry={tryFeature}
    />
  );
}
