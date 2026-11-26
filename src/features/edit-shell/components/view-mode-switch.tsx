'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { SegmentedTabs } from '@/shared/components/ui/segmented-tabs';

export type EditViewMode = 'paper' | 'problem' | 'split' | 'solution';

const ITEMS = [
  { id: 'paper', label: '시험지형' },
  { id: 'problem', label: '문제 크게' },
  { id: 'split', label: '반반' },
  { id: 'solution', label: '풀이 크게' },
];

export const ViewModeSwitch = ({ value, onChange }: { value: EditViewMode; onChange: (mode: EditViewMode) => void }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const change = (id: string) => {
    const mode = id as EditViewMode;
    onChange(mode);
    localStorage.setItem('odk.solve.view', mode);
    const next = new URLSearchParams(searchParams.toString());
    next.set('view', mode);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  return <SegmentedTabs ariaLabel="편집 보기" items={ITEMS} value={value} onChange={change} />;
};
