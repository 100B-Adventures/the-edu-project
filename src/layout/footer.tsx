import Image from 'next/image';
import Link from 'next/link';

import { Icon } from '@/shared/components/ui';
import { link } from '@/shared/constants';
import { PUBLIC } from '@/shared/constants/route';
import { cn } from '@/shared/lib';

export const Footer = () => {
  return (
    <footer className="bg-gray-11 w-full space-y-4 px-5 py-12 text-sm text-white">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex items-center gap-6">
          <Link
            href={PUBLIC.CORE.INDEX}
            aria-label="디에듀 홈으로 이동"
            className="max-tablet:min-h-touch-min max-tablet:inline-flex max-tablet:items-center"
          >
            <Image
              src="/logo.svg"
              alt="디에듀 로고"
              width={79}
              height={22}
              className="cursor-pointer"
            />
          </Link>
          <Link
            href={link.kakao}
            className={cn(
              'border-gray-3 ml-2 flex h-[46px] items-center gap-2 rounded-sm border px-8',
              'max-desktop:hidden',
              'hover:bg-gray-10'
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon.Mail />
            <span>소중한 의견 보내기</span>
          </Link>
        </div>

        <address className="space-y-1 not-italic">
          <p>
            <span className="font-semibold">상호명</span> | 정성컴퍼니
          </p>
          <p>
            <span className="font-semibold">대표자명</span> | 조성진
          </p>
          <p>
            <span className="font-semibold">사업자번호</span> | 798-31-01774
          </p>
          <p>
            <span className="font-semibold">사업장 주소</span> | 서울시 강남구
            역삼동 620-17 203호
          </p>
          <p>
            <span className="font-semibold">전화번호</span> | 010-6856-6609
          </p>
          <p>
            <span className="font-semibold">문의 이메일</span> |{' '}
            <a
              href="mailto:support@hongong.today"
              className="max-tablet:min-h-touch-min max-tablet:inline-flex max-tablet:items-center hover:underline"
            >
              support@hongong.today
            </a>
          </p>
        </address>

        <Link
          href={link.terms}
          aria-label="이용약관 전문 보기"
          target="_blank"
          className="max-tablet:min-h-touch-min max-tablet:inline-flex max-tablet:items-center hover:underline"
        >
          서비스 이용약관 바로 가기
        </Link>
        <Link
          href="/privacy/tracking"
          className="max-tablet:min-h-touch-min max-tablet:inline-flex max-tablet:items-center ml-4 hover:underline"
        >
          자동 수집 도구 안내
        </Link>
        <Link
          href="/account-deletion"
          className="max-tablet:min-h-touch-min max-tablet:inline-flex max-tablet:items-center ml-4 hover:underline"
        >
          계정 삭제 안내
        </Link>
        <Link
          href="/about"
          lang="en"
          className="max-tablet:min-h-touch-min max-tablet:inline-flex max-tablet:items-center ml-4 hover:underline"
        >
          About (English)
        </Link>
      </div>
    </footer>
  );
};
