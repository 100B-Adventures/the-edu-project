'use client';

import { useRouter } from 'next/navigation';

import { SegmentedTabs } from '@/shared/components/ui/segmented-tabs';

export type EditViewMode = 'paper' | 'problem' | 'split' | 'solution';

const ITEMS = [
  { id: 'paper', label: '시험지형' },
  { id: 'problem', label: '문제 크게' },
  { id: 'split', label: '반반' },
  { id: 'solution', label: '풀이 크게' },
];

export const ViewModeSwitch = ({
  value,
  onChange,
}: {
  value: EditViewMode;
  onChange: (mode: EditViewMode) => void;
}) => {
  const router = useRouter();

  const change = (id: string) => {
    const mode = id as EditViewMode;
    onChange(mode);
    localStorage.setItem('odk.solve.view', mode);
    // 기존 풀이 화면들의 next/navigation mock 계약을 불필요하게 넓히지 않는다.
    // 현재 주소는 브라우저에서 읽고 실제 이동만 Next router에 맡긴다.
    const next = new URLSearchParams(window.location.search);
    next.set('view', mode);
    router.replace(`${window.location.pathname}?${next.toString()}`, {
      scroll: false,
    });
  };

  return (
    <SegmentedTabs
      ariaLabel="편집 보기"
      items={ITEMS}
      value={value}
      onChange={change}
    />
  );
};
