'use client';

import { useEffect, useRef, useState } from 'react';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Script from 'next/script';

import { repository as courseRepository } from '@/entities/course';
import type { CourseOrderCreateResult, CourseProduct } from '@/entities/course';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';

import { slice3Repository } from '../api/slice3.repository';
import { Slice3Page, Slice3Status } from './slice3-layout';

type TossPayment = {
  requestPayment(input: {
    method: 'CARD';
    amount: { currency: 'KRW'; value: number };
    orderId: string;
    orderName: string;
    successUrl: string;
    failUrl: string;
    customerEmail?: string;
    customerName?: string;
  }): Promise<void>;
};

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => {
      payment(input: { customerKey: string }): TossPayment;
    };
  }
}

export const CheckoutPage = () => {
  const params = useSearchParams();
  const courseId = Number(params.get('courseId'));
  const selectedProductId = Number(params.get('productId'));
  const friendCode = params.get('ref') ?? '';
  const [products, setProducts] = useState<CourseProduct[]>([]);
  const [productId, setProductId] = useState(selectedProductId);
  const [order, setOrder] = useState<CourseOrderCreateResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!Number.isInteger(courseId) || courseId <= 0) return;
    void courseRepository
      .getCourseProducts(courseId)
      .then((items) => {
        setProducts(items);
        if (!productId && items[0]) setProductId(items[0].productId);
      })
      .catch(() => setError('상품 정보를 불러오지 못했어요.'));
  }, [courseId, productId]);

  const createOrder = async () => {
    if (!productId) return;
    setBusy(true);
    setError('');
    try {
      setOrder(
        await courseRepository.createCourseOrder({
          courseId,
          productId,
          shareCode: friendCode || undefined,
        })
      );
    } catch {
      setError('주문을 만들지 못했어요. 로그인과 수강 상태를 확인해 주세요.');
    } finally {
      setBusy(false);
    }
  };

  const pay = async () => {
    if (!order) return;
    const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? '';
    if (!clientKey.startsWith('test_ck_') || !window.TossPayments) {
      setError(
        '토스페이먼츠 시험 결제 키 또는 시험 모듈을 확인해 주세요. 실결제 키는 사용할 수 없어요.'
      );
      return;
    }
    const type = order.planType === 'SELF_PACED' ? 'ebook' : 'program';
    const payment = window.TossPayments(clientKey).payment({
      customerKey: `dedu-${order.orderId}`,
    });
    try {
      await payment.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: order.amount },
        orderId: order.orderKey,
        orderName: order.courseTitle,
        successUrl: `${window.location.origin}/pay-done?type=${type}`,
        failUrl: `${window.location.origin}/checkout?courseId=${courseId}&productId=${productId}`,
        customerName: order.customerName,
      });
    } catch {
      setError(
        '결제창을 열지 못했어요. 결제되지 않았습니다. 잠시 뒤 다시 시도해 주세요.'
      );
    }
  };

  return (
    <Slice3Page
      eyebrow="안전 결제"
      title="무엇을 사는지 마지막으로 확인해요"
      description="토스페이먼츠 시험 환경에서만 열립니다. 승인 전에는 수강 등록이 생기지 않아요."
    >
      <Script
        src="https://js.tosspayments.com/v2/standard"
        strategy="afterInteractive"
      />
      {!Number.isInteger(courseId) || courseId <= 0 ? (
        <Slice3Status
          title="상품 주소를 확인해 주세요"
          description="판매 화면에서 다시 결제를 시작해 주세요."
        />
      ) : !order ? (
        <Card>
          <Card.Content className="gap-content-gap flex flex-col">
            {products.map((product) => (
              <label
                key={product.productId}
                className="border-line-line2 rounded-card min-h-touch-min flex cursor-pointer items-center justify-between border p-4"
              >
                <span className="font-body2-heading text-text-main">
                  {product.planType}
                </span>
                <span className="font-body2-normal text-gray-9">
                  {product.price.toLocaleString()}원
                </span>
                <input
                  type="radio"
                  name="product"
                  checked={productId === product.productId}
                  onChange={() => setProductId(product.productId)}
                />
              </label>
            ))}
            {friendCode && (
              <p className="font-caption-normal text-gray-9">
                친구 코드가 입력됐어요: {friendCode}. 최종 적용 여부와 금액은
                서버에서 확인해요.
              </p>
            )}
            <Button
              onClick={createOrder}
              isLoading={busy}
              disabled={!productId}
              size="cta"
            >
              주문 내용 확인하기
            </Button>
          </Card.Content>
        </Card>
      ) : (
        <Card>
          <Card.Header>
            <div>
              <Card.Title>{order.courseTitle}</Card.Title>
              <Card.Description>
                {order.amount.toLocaleString()}원 · {order.planType}
              </Card.Description>
            </div>
          </Card.Header>
          <Card.Footer>
            <Button
              onClick={pay}
              size="cta"
            >
              토스 시험 결제로 이동
            </Button>
          </Card.Footer>
        </Card>
      )}
      {error && (
        <p className="font-body2-heading text-system-warning">{error}</p>
      )}
    </Slice3Page>
  );
};

export const PayDonePage = () => {
  const params = useSearchParams();
  const once = useRef(false);
  const [status, setStatus] = useState<
    'confirming' | 'activating' | 'done' | 'pending' | 'error'
  >('confirming');
  const type = params.get('type') === 'ebook' ? 'ebook' : 'program';

  useEffect(() => {
    if (once.current) return;
    once.current = true;
    const paymentKey = params.get('paymentKey') ?? '';
    const orderKey = params.get('orderId') ?? '';
    const amount = Number(params.get('amount'));
    if (
      !paymentKey ||
      !orderKey ||
      !Number.isSafeInteger(amount) ||
      amount < 0
    ) {
      setStatus('error');
      return;
    }
    let active = true;
    const confirmAndWaitForAccess = async () => {
      try {
        await slice3Repository.confirmOrder(paymentKey, orderKey, amount);
        if (!active) return;
        setStatus('activating');
        for (let attempt = 0; attempt < 5; attempt += 1) {
          try {
            if (type === 'ebook') await slice3Repository.library();
            else await slice3Repository.program();
            if (active) setStatus('done');
            return;
          } catch {
            if (attempt < 4) {
              await new Promise((resolve) => window.setTimeout(resolve, 2000));
            }
          }
        }
        if (active) setStatus('pending');
      } catch {
        if (active) setStatus('error');
      }
    };
    void confirmAndWaitForAccess();
    return () => {
      active = false;
    };
  }, [params, type]);

  return (
    <Slice3Page
      eyebrow="결제 결과"
      title={
        status === 'done'
          ? '결제가 완료됐어요'
          : status === 'pending'
            ? '결제는 완료됐고 등록을 확인하고 있어요'
            : status === 'error'
              ? '결제 확인이 끝나지 않았어요'
              : '결제 접수를 확인하고 있어요'
      }
      description="브라우저 결과만 믿지 않고 서버가 주문 번호와 금액을 다시 확인합니다."
    >
      {(status === 'confirming' || status === 'activating') && (
        <Slice3Status
          title={status === 'confirming' ? '접수 확인 중' : '사용 권한 확인 중'}
          description="브라우저 결과가 아니라 서버 등록까지 확인하고 있어요. 최대 10초 걸릴 수 있어요."
        />
      )}
      {status === 'pending' && (
        <Slice3Status
          title="결제는 중복되지 않아요"
          description="다시 결제하지 마세요. 등록 확인이 늦어지고 있어 주문 내역을 먼저 확인해 주세요."
        />
      )}
      {status === 'error' && (
        <Slice3Status
          title="승인 여부를 확인해 주세요"
          description="다시 결제하지 말고 주문 내역을 먼저 확인해 주세요."
        />
      )}
      {status === 'done' && (
        <Card>
          <Card.Header>
            <div>
              <Card.Title>
                {type === 'ebook'
                  ? '내 서재에서 바로 읽을 수 있어요'
                  : '58일 사전 과제를 시작해 주세요'}
              </Card.Title>
              <Card.Description>
                결제 승인과 수강 등록이 함께 확인됐어요.
              </Card.Description>
            </div>
          </Card.Header>
          <Card.Footer>
            <Button
              asChild
              size="cta"
            >
              <Link
                href={
                  type === 'ebook' ? '/library' : '/dashboard/student/program'
                }
              >
                {type === 'ebook' ? '내 서재 열기' : '58일 진행표 열기'}
              </Link>
            </Button>
          </Card.Footer>
        </Card>
      )}
    </Slice3Page>
  );
};
