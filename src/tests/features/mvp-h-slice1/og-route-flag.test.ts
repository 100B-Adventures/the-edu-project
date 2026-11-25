import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/lib/og', () => ({
  OG_PRESETS: { STUDY_NOTE: 'study-note' },
  createOgImage: vi.fn(() => new Response('png', { status: 200 })),
}));

describe('시험 항목 S31 공유 미리보기 그림도 플래그를 따른다 (교차 리뷰 P2-2)', () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => vi.unstubAllEnvs());

  const call = async () => {
    const route = await import(
      '@/app/(public)/s/[token]/opengraph-image/route'
    );
    return route.GET(
      new Request('https://dev.d-edu.site/s/abc/opengraph-image')
    );
  };

  it('S31-1 플래그가 꺼져 있으면 404 이고 그림을 만들지 않는다', async () => {
    vi.stubEnv('NEXT_PUBLIC_MVPH_SLICE1', 'off');
    const response = await call();
    expect(response.status).toBe(404);
    const og = await import('@/shared/lib/og');
    expect(og.createOgImage).not.toHaveBeenCalled();
  });

  it('S31-2 플래그가 켜져 있으면 그림을 돌려준다', async () => {
    vi.stubEnv('NEXT_PUBLIC_MVPH_SLICE1', 'on');
    const response = await call();
    expect(response.status).toBe(200);
  });
});
