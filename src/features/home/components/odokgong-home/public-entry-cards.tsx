import Link from 'next/link';

import { SHELL_CAPABILITIES } from '@/features/app-shell/model/shell-capabilities';
import { PROGRAM_BOARD } from '@/features/home/content/odokgong-home';
import { PUBLIC } from '@/shared/constants';
import { BookOpen, ClipboardCheck, LogIn, MessagesSquare } from 'lucide-react';

const LEVEL_ENTRY_CARD = {
  title: '58일 레벨 테스트',
  body: '25분 진단으로 지금 공부 단계와 58일 동안 바꿀 점을 확인합니다.',
  href: '/level',
  cta: '레벨 테스트 받기',
  Icon: ClipboardCheck,
} as const;

const ENTRY_CARDS = [
  {
    title: '전자책',
    body: '구매한 오독공 전자책과 미리보기를 확인합니다.',
    href: '/library',
    cta: '전자책 보기',
    Icon: BookOpen,
  },
  {
    title: '고민상담',
    body: '공부 고민을 비공개로 남기고 상담 사례를 살펴봅니다.',
    href: PUBLIC.CONSULT.INDEX,
    cta: '고민상담 보기',
    Icon: MessagesSquare,
  },
  {
    title: '로그인',
    body: '이미 시작했다면 오늘 이어서 할 학습으로 돌아갑니다.',
    href: PUBLIC.CORE.LOGIN,
    cta: '로그인하기',
    Icon: LogIn,
  },
] as const;

export const PublicEntryCards = () => {
  const entryCards = SHELL_CAPABILITIES.levelTest
    ? [LEVEL_ENTRY_CARD, ...ENTRY_CARDS]
    : ENTRY_CARDS;

  return (
    <>
      <section
        aria-label={PROGRAM_BOARD.eyebrow}
        className="rounded-section bg-gray-12 p-card-pad gap-block-gap flex flex-col text-white"
      >
        <p className="font-caption-heading text-orange-5">
          {PROGRAM_BOARD.eyebrow}
        </p>
        <h2 className="font-headline2-heading whitespace-pre-line">
          {PROGRAM_BOARD.title}
        </h2>
        <Link
          href="/courses"
          className="min-h-touch-min font-body2-heading text-orange-5 inline-flex items-center"
        >
          {PROGRAM_BOARD.cta}
        </Link>
      </section>

      <section
        aria-label="다른 시작 경로"
        className="gap-grid-gap tablet:grid-cols-2 desktop:grid-cols-4 grid grid-cols-1"
      >
        {entryCards.map(({ title, body, href, cta, Icon }) => (
          <article
            key={title}
            className="border-line-line1 rounded-card p-card-pad gap-content-gap flex flex-col border bg-white"
          >
            <Icon
              size={24}
              aria-hidden="true"
              className="text-orange-9"
            />
            <div className="gap-content-gap flex flex-col">
              <h2 className="font-body1-heading">{title}</h2>
              <p className="font-body2-normal text-gray-9">{body}</p>
            </div>
            <Link
              href={href}
              className="min-h-touch-min font-label-heading text-orange-11 inline-flex items-center"
            >
              {cta}
            </Link>
          </article>
        ))}
      </section>
    </>
  );
};
