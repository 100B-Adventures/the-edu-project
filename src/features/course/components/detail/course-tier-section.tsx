'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { type CourseProduct } from '@/entities/course';
import { Button, StatusBadge, showBottomToast } from '@/shared/components/ui';
import { cn } from '@/shared/lib';
import { isMvpHShellEnabled } from '@/shared/lib/mvp-h-slice';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

import {
  useCourseProductsQuery,
  useCreateCourseOrderMutation,
} from '../../hooks';
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
  isAuthenticated: boolean;
  onRequireLogin: () => void;
};

/* ─────────────────────────────────────────────────────
 * 3티어 선택·구매 섹션
 *  - 129,000(자율) / 190,000(관리형·BEST) / 790,000(1:1 프리미엄)
 *  - 실결제 confirm은 PG 미정(⛔ R-A)이라 스텁 — 주문 생성까지만 요청한다.
 * ────────────────────────────────────────────────────*/
export const CourseTierSection = ({
  courseId,
  isAuthenticated,
  onRequireLogin,
}: CourseTierSectionProps) => {
  const router = useRouter();
  const {
    data: products,
    isLoading,
    isError,
  } = useCourseProductsQuery(courseId);
  const { mutate: createOrder, isPending } = useCreateCourseOrderMutation();
  const [pendingProductId, setPendingProductId] = useState<number | null>(null);
  const [orderStub, setOrderStub] = useState<{
    orderKey: string;
    amount: number;
    planLabel: string;
  } | null>(null);

  if (isLoading) {
    return <CourseTierSkeleton />;
  }

  if (isError || !products || products.length === 0) {
    return null;
  }

  const handlePurchase = (product: CourseProduct) => {
    if (!isAuthenticated) {
      onRequireLogin();
      return;
    }
    if (isMvpHShellEnabled()) {
      router.push(
        `/checkout?courseId=${courseId}&productId=${product.productId}`
      );
      return;
    }
    setPendingProductId(product.productId);
    createOrder(
      { courseId, productId: product.productId, studentId: null },
      {
        onSuccess: (result) => {
          setOrderStub({
            orderKey: result.orderKey,
            amount: result.amount,
            // 백엔드는 planLabel 을 주지 않는다 → planType 으로 라벨 생성.
            planLabel:
              result.planLabel ??
              planTypeLabel(result.planType ?? product.planType),
          });
          showBottomToast('주문이 생성됐어요. 결제 연동은 준비 중이에요.');
        },
        onSettled: () => setPendingProductId(null),
      }
    );
  };

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
            const isPremium = product.planType === 'PREMIUM_1ON1';
            const isSubmitting =
              isPending && pendingProductId === product.productId;

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

                {isPremium ? (
                  // ⛔ 회장 확인 필요: 790 티어(1:1 프리미엄) 혜택 실체 미정
                  // (frd-v2.md §9 R-E 연장선 — 배정 튜터·1:1 커리큘럼 구성이
                  //  확정되지 않아 구매 버튼은 "상담 신청"으로 대체한다)
                  <Button
                    variant="outlined"
                    size="medium"
                    className="w-full"
                    onClick={() =>
                      showBottomToast(
                        '1:1 프리미엄은 상담 후 배정돼요. 곧 연락드릴게요.'
                      )
                    }
                  >
                    상담 신청하기
                  </Button>
                ) : (
                  <Button
                    variant={product.best ? 'primary' : 'outlined'}
                    size="medium"
                    className="w-full"
                    disabled={isSubmitting}
                    onClick={() => handlePurchase(product)}
                  >
                    {isSubmitting ? '주문 생성 중…' : '이 티어로 시작하기'}
                  </Button>
                )}
              </div>
            );
          })}
      </div>

      {orderStub && (
        <div className="border-line-line2 rounded-card flex flex-col gap-1 border border-dashed bg-white p-4">
          <span className="font-body2-heading text-text-main">
            주문이 생성됐어요 — {orderStub.planLabel} ·{' '}
            {priceLabel(orderStub.amount)}
          </span>
          <span className="font-caption-normal text-text-sub2">
            주문번호 {orderStub.orderKey} · 실제 결제 연동(PG)은 준비 중이에요.
            미검증: 결제 승인·웹훅은 dev 미배포라 실 API로 확인 못 했어요.
          </span>
        </div>
      )}
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
