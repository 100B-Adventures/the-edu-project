'use client';

import Link from 'next/link';

import { Button, StatusBadge } from '@/shared/components/ui';
import { PUBLIC } from '@/shared/constants';
import { cn } from '@/shared/lib';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

import { useCourseProductsQuery } from '../../hooks';
import { dailyPriceLabel, planTypeLabel, priceLabel } from '../../lib/format';

/* ─────────────────────────────────────────────────────
 * 티어별 상세(재무 숫자 아닌 "관리강도" 설명) — 백엔드가 안 내려주는
 * 마케팅/운영 카피라 프론트에 planType 키로 정적 매핑한다.
 *  근거: prototypes/mvp-f-코스-티어선택-v1-product-designer.html (톤 참고)
 * ────────────────────────────────────────────────────*/
const TIER_COPY: Record<
  string,
  {
    tagline: string;
    bullets: string[];
    comparison?: string;
    honestNote: string;
  }
> = {
  SELF_PACED: {
    tagline: '내 페이스대로, 콘텐츠만',
    bullets: ['50일 전 차시 열람', 'AI 조교 기본 코칭', '검수·환급 없음'],
    honestNote: '자율형은 관리·검수·환급 대상이 아니에요.',
  },
  MANAGED: {
    tagline: '매일 확인받고, 등급 오르면 전액 환급',
    bullets: [
      '매일 제출물 검수(대표 직접)',
      '90% 이상 제출 + 결석 0일',
      '등급 인증 시 190,000원 전액 환급',
    ],
    comparison: '과외 하루 21,400원 vs 이 코스 하루 3,800원',
    honestNote: '제출 기준 미달 또는 등급 미달 시 환급되지 않아요.',
  },
  PREMIUM_1ON1: {
    tagline: '1:1 밀착 배정 — 상담 후 확정',
    bullets: [
      '담당 튜터 1:1 배정',
      '주간 학부모 리포트',
      '등급 인증 시 전액 환급',
    ],
    comparison: '과외 하루 21,400원 vs 이 코스 하루 15,800원',
    honestNote: '제출 기준 미달 또는 등급 미달 시 환급되지 않아요.',
  },
};

const CERT_WINDOW_DAYS = 90;

type CourseTierSectionProps = {
  courseId: number;
};

/* ─────────────────────────────────────────────────────
 * 3티어 선택·상담 섹션
 *  - 129,000(자율) / 190,000(관리형·BEST) / 790,000(1:1 프리미엄)
 *  - 가격은 비교 기준으로 유지하고, 결제 방법은 상담 뒤 안내한다.
 * ────────────────────────────────────────────────────*/
export const CourseTierSection = ({ courseId }: CourseTierSectionProps) => {
  const {
    data: products,
    isLoading,
    isError,
  } = useCourseProductsQuery(courseId);
  if (isLoading) {
    return <CourseTierSkeleton />;
  }

  if (isError || !products || products.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-body1-heading text-text-main">수강 티어 선택</h2>
        <span className="font-caption-normal text-text-sub2">
          50일 프로그램 기준
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[...products]
          .sort((a, b) => a.price - b.price)
          .map((product) => {
            const copy = TIER_COPY[product.planType] ?? {
              tagline: product.planLabel ?? planTypeLabel(product.planType),
              bullets: [] as string[],
              comparison: undefined as string | undefined,
              honestNote: '',
            };
            return (
              <div
                key={product.productId}
                className={cn(
                  'border-line-line2 rounded-card relative flex flex-col gap-3 border bg-white p-5',
                  product.best && 'border-key-color-primary border-2'
                )}
              >
                {product.best && (
                  <StatusBadge
                    variant="primary"
                    label="BEST"
                    className="absolute -top-3 left-4"
                  />
                )}

                <div className="flex flex-col gap-1">
                  <span className="font-label-heading text-text-main">
                    {planTypeLabel(product.planType)}
                  </span>
                  <span className="font-caption-normal text-text-sub2">
                    {copy.tagline}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="font-headline2-heading text-text-main tabular-nums">
                    {priceLabel(product.price)}
                  </span>
                  <span className="font-caption-normal text-key-color-primary tabular-nums">
                    {dailyPriceLabel(product.price)}
                  </span>
                  <span className="font-caption-normal text-text-sub2">
                    결제는 상담 뒤 안내
                  </span>
                  {copy.comparison && (
                    <span className="font-caption-normal text-text-sub2">
                      {copy.comparison}
                    </span>
                  )}
                </div>

                <ul className="flex flex-col gap-1.5">
                  {copy.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="font-caption-normal text-text-sub1 flex items-start gap-1.5"
                    >
                      <CheckCircle2
                        size={14}
                        className="text-key-color-primary mt-0.5 shrink-0"
                      />
                      {bullet}
                    </li>
                  ))}
                </ul>

                {product.refundGuaranteed && (
                  <div className="bg-orange-1 rounded-button flex items-start gap-1.5 p-2.5">
                    <ShieldCheck
                      size={14}
                      className="text-key-color-primary mt-0.5 shrink-0"
                    />
                    <span className="font-caption-normal text-text-sub1">
                      등급 인증 신청은 코스 종료 후 {CERT_WINDOW_DAYS}일
                      이내에만 가능해요.
                    </span>
                  </div>
                )}

                {/* 정직 고지: 미달 시 혜택 없음을 숨기지 않는다(다크패턴 경계). */}
                {copy.honestNote && (
                  <p className="font-caption-normal text-text-sub2">
                    ⚠️ {copy.honestNote}
                  </p>
                )}

                <Button
                  asChild
                  variant={product.best ? 'primary' : 'outlined'}
                  size="medium"
                  className="w-full"
                >
                  <Link
                    href={PUBLIC.CONSULT.INDEX}
                    data-testid="course-tier-consult-link"
                  >
                    상담 신청
                  </Link>
                </Button>
              </div>
            );
          })}
      </div>
    </section>
  );
};

const CourseTierSkeleton = () => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
    {Array.from({ length: 3 }).map((_, index) => (
      <div
        key={index}
        className="border-line-line2 bg-gray-1 rounded-card h-64 animate-pulse border"
      />
    ))}
  </div>
);
