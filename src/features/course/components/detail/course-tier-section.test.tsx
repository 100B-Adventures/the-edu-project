import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { CourseTierSection } from './course-tier-section';

const mocks = vi.hoisted(() => ({
  useCourseProductsQuery: vi.fn(),
  useCreateCourseOrderMutation: vi.fn(),
  createOrder: vi.fn(),
}));

vi.mock('../../hooks', () => ({
  useCourseProductsQuery: mocks.useCourseProductsQuery,
  useCreateCourseOrderMutation: mocks.useCreateCourseOrderMutation,
}));

describe('코스 티어 상담 CTA 계약', () => {
  beforeEach(() => {
    mocks.useCourseProductsQuery.mockReturnValue({
      data: [
        {
          productId: 1,
          planType: 'SELF_PACED',
          price: 129000,
          refundGuaranteed: false,
          reviewManaged: false,
          best: false,
        },
        {
          productId: 2,
          planType: 'MANAGED',
          price: 190000,
          refundGuaranteed: true,
          reviewManaged: true,
          best: true,
        },
        {
          productId: 3,
          planType: 'PREMIUM_1ON1',
          price: 790000,
          refundGuaranteed: true,
          reviewManaged: true,
          best: false,
        },
      ],
      isLoading: false,
      isError: false,
    });
    mocks.useCreateCourseOrderMutation.mockReturnValue({
      mutate: mocks.createOrder,
      isPending: false,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  test('TC-V2023-001 유료 티어는 가격과 결제 안내를 유지하고 상담소로 연결한다', () => {
    render(<CourseTierSection courseId={1000} />);

    const links = screen.getAllByTestId('course-tier-consult-link');
    expect(links).toHaveLength(3);
    links.forEach((link) => {
      expect(link).toHaveTextContent('상담 신청');
      expect(link).toHaveAttribute('href', '/consult');
    });

    expect(screen.getByText('129,000원')).toBeVisible();
    expect(screen.getByText('190,000원')).toBeVisible();
    expect(screen.getByText('790,000원')).toBeVisible();
    expect(screen.getAllByText('결제는 상담 뒤 안내')).toHaveLength(3);
  });

  test('TC-V2023-002 상담 CTA는 주문 생성을 연결하지 않고 내부 문구를 노출하지 않는다', () => {
    render(<CourseTierSection courseId={1001} />);

    expect(mocks.useCreateCourseOrderMutation).not.toHaveBeenCalled();
    expect(mocks.createOrder).not.toHaveBeenCalled();
    expect(screen.queryByText('이 티어로 시작하기')).not.toBeInTheDocument();
    expect(
      screen.queryByText(/주문번호|미검증|PG|dev/)
    ).not.toBeInTheDocument();
  });
});
