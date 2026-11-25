import { isMvpHSliceEnabled } from '@/shared/lib/mvp-h-slice';
import { OG_PRESETS, createOgImage } from '@/shared/lib/og';

export function GET(request: Request) {
  // 공유 링크 페이지가 꺼져 있으면 그 미리보기 그림도 열지 않는다(교차 리뷰 P2-2, N-1).
  if (!isMvpHSliceEnabled()) {
    return new Response('Not Found', { status: 404 });
  }
  return createOgImage({
    preset: OG_PRESETS.STUDY_NOTE,
    origin: new URL(request.url).origin,
  });
}
