import Link from 'next/link';

import { Button } from '@/shared/components/ui/button';
import { EmptyState } from '@/shared/components/ui/empty-state';

export default function NotFound() {
  return (
    <main className="max-w-dialog-wide mx-auto w-full px-4 py-10">
      <EmptyState
        title="찾는 페이지가 없어요"
        description="주소가 바뀌었거나 지워진 페이지예요."
        action={
          <Button asChild>
            <Link href="/">홈으로 가기</Link>
          </Button>
        }
      />
    </main>
  );
}
