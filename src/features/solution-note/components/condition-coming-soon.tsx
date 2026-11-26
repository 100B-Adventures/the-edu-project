import { Construction } from 'lucide-react';

/** D-134: 3.0에서는 입력을 열지 않고 모든 학생에게 같은 안내 한 장만 보인다. */
export const ConditionComingSoon = () => (
  <section
    data-condition-card
    className="border-line-line1 rounded-card p-card-pad gap-content-gap flex items-start border bg-white"
    aria-labelledby="condition-coming-soon-title"
  >
    <span className="bg-orange-1 text-orange-10 rounded-pill flex size-touch-min shrink-0 items-center justify-center">
      <Construction aria-hidden />
    </span>
    <div>
      <h2
        id="condition-coming-soon-title"
        className="font-body1-heading text-gray-12"
      >
        조건해석은 준비 중이에요
      </h2>
      <p className="font-body2-normal text-gray-9">
        문제의 조건을 단계별로 정리하는 기능은 다음 판에서 열립니다.
      </p>
    </div>
  </section>
);
