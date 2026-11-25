import { cn } from '@/shared/lib';

/** 오독공 글자 로고: "오독" 오독 주황, "공" 먹색(시안 edit22-C). 이미지 없이 글자로 그린다. */
export const OdokLogo = ({ className }: { className?: string }) => (
  <span
    className={cn(
      'font-headline2-heading inline-flex items-baseline',
      className
    )}
    aria-label="오독공"
  >
    <span className="text-orange-9">오독</span>
    <span className="text-gray-12">공</span>
  </span>
);
