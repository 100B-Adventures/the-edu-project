'use client';

import Link from 'next/link';

import { useResumeQuery } from '@/features/app-shell/hooks/use-shell-queries';
import { PortalPopularPosts } from '@/features/home/components/portal-popular-posts';
import {
  DEFAULT_HERO_VARIANT,
  HOME_HERO_COPY,
  NOTE_SEARCH_CHIPS,
  PROGRAM_BOARD,
  STUDY_FLOW_FOUR,
} from '@/features/home/content/odokgong-home';
import { useSession } from '@/providers/session/session-context';
import { ActionCard } from '@/shared/components/action-card/action-card';
import { PRIVATE, PUBLIC } from '@/shared/constants';
import { isMvpHSliceEnabled } from '@/shared/lib/mvp-h-slice';

const RESUME_LABEL = {
  REVIEW: 'N회독',
  SOLVE: '풀던 문제',
  NOTE: '내 노트',
} as const;
const RESUME_HREF = {
  REVIEW: PRIVATE.DASHBOARD.STUDENT_REVIEW,
  SOLVE: PRIVATE.DASHBOARD.STUDENT,
  NOTE: PRIVATE.DASHBOARD.UNIT_NOTES,
} as const;

/** 로그인한 학생의 "이어서 하기" 한 줄. 할 것이 없으면 줄 자체를 그리지 않는다(N2). */
const ResumeLine = () => {
  const { data } = useResumeQuery();
  const item = data?.item;
  if (!item || (item.kind === 'REVIEW' && !isMvpHSliceEnabled())) return null;
  return (
    <ActionCard
      variant="line"
      eyebrow="이어서 하기"
      title={item.title}
      subtitle={item.subtitle ?? undefined}
      cta={{ label: RESUME_LABEL[item.kind], href: RESUME_HREF[item.kind] }}
    />
  );
};

/**
 * 오독공 홈(FDD §5.2). 위에서 아래: 불안 문안 → 노트 검색 칸 + 칩 → 58일 큰 판 → 칼럼 →
 * 공부 흐름 네 칸. 후기·자기선언·베스트·영상·광고 칸은 근거 데이터가 생기면 그린다(능력 상수 false).
 */
export const OdokgongHome = () => {
  const { member } = useSession();
  const copy = HOME_HERO_COPY[DEFAULT_HERO_VARIANT];

  return (
    <main
      className="px-section-gap py-section-gap gap-block-gap mx-auto flex w-full max-w-280 flex-col"
      data-testid="odokgong-home"
    >
      {member?.role === 'ROLE_STUDENT' && <ResumeLine />}
      <section
        aria-label="오독공 소개"
        className="rounded-section bg-orange-1 px-room-page-pad-mobile py-room-page-pad tablet:px-room-page-pad gap-block-gap flex flex-col"
      >
        <p className="font-caption-heading text-orange-11">{copy.eyebrow}</p>
        <h1 className="font-headline1-heading text-gray-12 whitespace-pre-line">
          {copy.title}
        </h1>
        <p className="font-body2-normal text-gray-10">{copy.lead}</p>
        <div className="gap-content-gap flex flex-wrap">
          <Link
            href={PUBLIC.COURSE.LIST}
            className="min-h-control-lg px-button-wide-x rounded-button bg-orange-9 font-label-heading shadow-cta inline-flex items-center justify-center text-white"
          >
            {PROGRAM_BOARD.cta}
          </Link>
        </div>
      </section>

      <section
        aria-label="다른 학생 노트 찾기"
        className="border-line-line1 rounded-card p-card-pad gap-content-gap flex flex-col border bg-white"
      >
        <h2 className="font-body2-heading text-text-main">
          다른 학생 노트 찾기
        </h2>
        <Link
          href={PUBLIC.COMMUNITY.COLUMN.LIST}
          className="border-line-line2 rounded-input min-h-touch-min px-card-pad font-body2-normal text-gray-8 flex items-center border"
        >
          단원, 문제 출처 (예: 미분계수, 2027 6월)
        </Link>
        <ul className="gap-content-gap flex flex-wrap">
          {NOTE_SEARCH_CHIPS.map((chip) => (
            <li key={chip}>
              <Link
                href={PUBLIC.COMMUNITY.COLUMN.LIST}
                className="min-h-chip-min px-button-chip-x rounded-pill border-line-line1 font-caption-heading text-gray-9 inline-flex items-center border bg-white"
              >
                {chip}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <PortalPopularPosts />

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
          href={PUBLIC.COURSE.LIST}
          className="min-h-touch-min font-body2-heading text-orange-5 inline-flex items-center"
        >
          {PROGRAM_BOARD.cta}
        </Link>
      </section>

      <section
        aria-label="공부 흐름"
        className="gap-grid-gap tablet:grid-cols-2 desktop:grid-cols-4 grid grid-cols-1"
      >
        {STUDY_FLOW_FOUR.map((step) => (
          <div
            key={step.title}
            className="border-line-line1 rounded-card p-card-pad border bg-white"
          >
            <h3 className="font-body2-heading text-text-main">{step.title}</h3>
            <p className="font-body2-normal text-gray-9">{step.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
};
