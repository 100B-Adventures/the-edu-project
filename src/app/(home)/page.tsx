import type { Metadata } from 'next';

import { OdokgongHome } from '@/features/home/components/odokgong-home/odokgong-home';
import { PortalHome } from '@/features/home/components/portal-home';
import { Footer } from '@/layout/footer';
import { PageViewTracker } from '@/shared/components/analytics';
import { isMvpHShellEnabled } from '@/shared/lib/mvp-h-slice';

// MVP-G 공개 포털 홈 — frd-public-portal-v1 §4.1 모듈 순서(모바일 고정,
// v8 계승): 히어로 → 오늘의 오픈챌린지 → 인기 글 → 상담소 → 대표 멘토.
// 오늘의 오픈챌린지는 기존 OpenChallengeShell/ChallengeListClient를
// 100% 그대로 재사용한다(신규 구현 0) — id="today-challenge"로 히어로
// CTA의 스크롤 타깃만 새로 건다.
export const metadata: Metadata = {
  title: '오독공 | 오늘 한 문제, 또는 비공개 상담',
  description:
    '디에듀 AI 코치와 함께 문제를 제대로 풀어보세요. 고민이 있다면 비공개로 상담을 신청할 수 있어요.',
};

export default function HomePage() {
  // mvp-h shell: 켜면 오독공 홈(불안 문안·노트 검색·58일 판·공부 흐름), 끄면 기존 포털 홈 그대로.
  const shellOn = isMvpHShellEnabled();
  return (
    <>
      <PageViewTracker pageName="open-challenge" />
      {shellOn ? <OdokgongHome /> : <PortalHome />}
      {/* 사업자 정보 공개(전자상거래법 표시 의무). 홈에 빠져 있던 것을 2026-10-08 복원. */}
      <Footer />
    </>
  );
}
