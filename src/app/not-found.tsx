import Link from 'next/link';

import { Button } from '@/shared/components/ui/button';
import { EmptyState } from '@/shared/components/ui/empty-state';
import { isMvpHShellEnabled } from '@/shared/lib/mvp-h-slice';

export default function NotFound() {
  const shellEnabled = isMvpHShellEnabled();
  return (
    <main className="max-w-dialog-wide mx-auto w-full px-4 py-10">
      <EmptyState
        title="찾는 페이지가 없어요"
        description={
          shellEnabled
            ? '이 화면은 아직 오독공에 없거나 주소가 바뀌었어요.'
            : '주소가 바뀌었거나 지워진 페이지예요.'
        }
        action={
          <Button asChild>
            <Link href={shellEnabled ? '/dashboard' : '/'}>홈으로 가기</Link>
          </Button>
        }
      />
    </main>
  );
}
