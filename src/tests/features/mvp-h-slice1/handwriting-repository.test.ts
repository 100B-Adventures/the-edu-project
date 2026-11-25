import { handwritingRepository } from '@/entities/handwriting/infrastructure/handwriting.repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));

vi.mock('@/shared/api', () => ({
  api: { private: { get: mocks.get, post: mocks.post } },
}));
vi.mock('@/shared/components/drawing', () => ({
  exportStrokesToBlob: async () => ({
    size: 9,
    arrayBuffer: async () => new ArrayBuffer(9),
  }),
}));

describe('시험 항목 S35 손필기 동의 판정과 PNG 만 올리기 (교차 리뷰 P1-3·P1-8)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('S35-1 동의한 문구 버전이 지금 버전과 같을 때만 동의로 본다', async () => {
    mocks.get.mockResolvedValue({
      data: { granted: true, version: 'v1', currentVersion: 'v1' },
    });
    expect(await handwritingRepository.getConsent('HANDWRITING_STORE')).toEqual(
      { granted: true }
    );
  });

  it('S35-2 거절: 옛 버전에 동의했으면 동의 안 한 것으로 본다', async () => {
    mocks.get.mockResolvedValue({
      data: { granted: true, version: 'v1', currentVersion: 'v2' },
    });
    expect(await handwritingRepository.getConsent('HANDWRITING_STORE')).toEqual(
      { granted: false }
    );
  });

  it('S35-3 pngOnly 는 PNG 한 객체만 올리고 획 좌표는 만들지도 올리지도 않는다', async () => {
    mocks.post.mockResolvedValue({
      data: {
        mediaAssetList: [
          {
            id: 3,
            mediaId: 'm',
            uploadUrl: 'https://s3.test/png',
            headers: {},
          },
        ],
      },
    });
    const fetchMock = vi.fn(async () => new Response('', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const ref = await handwritingRepository.uploadHandwriting({
      strokes: [],
      pngOnly: true,
    });
    vi.unstubAllGlobals();
    const sent = mocks.post.mock.calls[0]![1].mediaAssetList as Array<{
      targetType: string;
    }>;
    expect(sent.map((item) => item.targetType)).toEqual(['HANDWRITING_PNG']);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(ref).toMatchObject({
      pngMediaId: 3,
      strokesMediaId: null,
      strokesDeferred: false,
      strokeCount: 0,
      strokesSha256: null,
    });
  });
});
