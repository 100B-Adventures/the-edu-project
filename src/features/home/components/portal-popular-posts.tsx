'use client';

import Link from 'next/link';

import ColumnCard from '@/features/community/column/components/column-card';
import { ColumnListSkeleton } from '@/features/community/column/components/column-card-skeleton';
import { useColumnList } from '@/features/community/column/hooks/use-column-list';
import { PUBLIC } from '@/shared/constants';

/**
 * 공개 홈의 선생님 영상·칼럼 모듈. 칼럼은 승인된 column_article API를
 * 재사용한다. 공개 선생님 영상 목록 API와 승인 콘텐츠는 현재 없으므로
 * 영상 카드를 지어내지 않고 콘텐츠 공백을 명시한다.
 */
export function PortalPopularPosts() {
  const { data, isLoading, isError } = useColumnList({
    page: 0,
    sort: 'POPULAR',
  });

  const posts = data?.content?.slice(0, 4);

  return (
    <section
      aria-label="선생님 영상과 칼럼"
      className="gap-block-gap flex flex-col"
    >
      <div className="gap-content-gap flex flex-col">
        <h2 className="font-headline2-heading">조성진 선생님 영상</h2>
        <div className="border-line-line1 rounded-card p-card-pad border bg-white">
          <p className="font-body1-heading text-gray-12">
            공개된 선생님 영상이 아직 없습니다
          </p>
          <p className="font-body2-normal text-gray-9 mt-content-gap">
            승인된 영상과 공개 주소가 등록되면 이 자리에 최대 3편을 보여
            드립니다.
          </p>
        </div>
      </div>

      <div className="gap-content-gap flex flex-col">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-headline2-heading">칼럼</h2>
          <Link
            href={PUBLIC.BOARD.LIST}
            className="font-label-normal text-text-sub2"
          >
            더보기 →
          </Link>
        </div>

        {isLoading && <ColumnListSkeleton />}

        {!isLoading && (isError || !posts || posts.length === 0) && (
          <div className="border-line-line1 rounded-xl border bg-white px-8 py-10 text-center">
            <p className="font-body1-heading">
              {isError ? '글을 불러오지 못했어요' : '칼럼을 준비하고 있습니다'}
            </p>
          </div>
        )}

        {!isLoading && posts && posts.length > 0 && (
          <div className="gap-grid-gap tablet:grid-cols-2 desktop:grid-cols-4 grid min-w-0 grid-cols-1">
            {posts.map((column) => (
              <ColumnCard
                key={column.id}
                column={column}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
