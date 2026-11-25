import { StrokesOutboxDrain } from '@/app/_components/strokes-outbox-drain';
import {
  createMemoryStore,
  enqueueStrokes,
  flushStrokesOutbox,
  setOutboxStore,
  startOutboxDrain,
} from '@/entities/handwriting/infrastructure/strokes-outbox';
import type { Stroke } from '@/shared/components/drawing';
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  uploadStrokesObject: vi.fn(),
  attachStrokes: vi.fn(),
  session: { status: 'authenticated' as string },
}));

vi.mock('@/entities/handwriting/infrastructure/handwriting.repository', () => ({
  handwritingRepository: {
    uploadStrokesObject: mocks.uploadStrokesObject,
    attachStrokes: mocks.attachStrokes,
  },
}));
vi.mock('@/providers/session/session-context', () => ({
  useSession: () => mocks.session,
}));

const STROKES = [{ id: 'a' }] as unknown as Stroke[];
const UPLOADED = {
  strokesMediaId: 5,
  strokeCount: 1,
  strokeBytes: 10,
  strokesSha256: 'x'.repeat(64),
};
const networkError = () => Object.assign(new Error('offline'), { code: 'ERR' });

describe('시험 항목 S37 앱 전체 획 재업로드 (교차 리뷰 2회차 P1-6)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setOutboxStore(createMemoryStore());
    mocks.session.status = 'authenticated';
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('S37-1 백지 결과 뒤 오프라인이라 재첨부가 실패해 보관된 획은, 풀이노트 화면 없이도 온라인 복귀 이벤트에 붙는다', async () => {
    mocks.uploadStrokesObject.mockRejectedValueOnce(networkError());
    await enqueueStrokes(9, STROKES);
    // 백지 완료 직후의 첫 시도는 오프라인으로 실패한다.
    await flushStrokesOutbox();
    expect(mocks.attachStrokes).not.toHaveBeenCalled();

    // N회독 홈에 있는 상태에서 앱 전체 드레인이 켜져 있고, 처음엔 아직 실패한다.
    mocks.uploadStrokesObject.mockRejectedValueOnce(networkError());
    const stop = startOutboxDrain();
    await vi.waitFor(() =>
      expect(mocks.uploadStrokesObject).toHaveBeenCalledTimes(2)
    );

    // 온라인으로 돌아오면 바로 올려 붙인다.
    mocks.uploadStrokesObject.mockResolvedValue(UPLOADED);
    mocks.attachStrokes.mockResolvedValue({ strokesPending: false });
    window.dispatchEvent(new Event('online'));
    await vi.waitFor(() =>
      expect(mocks.attachStrokes).toHaveBeenCalledWith(9, UPLOADED)
    );
    stop();
  });

  it('S37-2 새로고침(앱 시작)에서 보관함에 남은 획이 있으면 시작 즉시 한 번 비운다', async () => {
    await enqueueStrokes(7, STROKES);
    mocks.uploadStrokesObject.mockResolvedValue(UPLOADED);
    mocks.attachStrokes.mockResolvedValue({ strokesPending: false });
    const stop = startOutboxDrain();
    await vi.waitFor(() =>
      expect(mocks.attachStrokes).toHaveBeenCalledWith(7, UPLOADED)
    );
    stop();
  });

  it('S37-3 계속 실패하면 30초 뒤 다시 시도하고, 멈추면 더 시도하지 않는다', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await enqueueStrokes(5, STROKES);
    mocks.uploadStrokesObject.mockRejectedValue(networkError());
    const stop = startOutboxDrain();
    await vi.waitFor(() =>
      expect(mocks.uploadStrokesObject).toHaveBeenCalledTimes(1)
    );
    await vi.advanceTimersByTimeAsync(31_000);
    await vi.waitFor(() =>
      expect(mocks.uploadStrokesObject).toHaveBeenCalledTimes(2)
    );
    stop();
    await vi.advanceTimersByTimeAsync(120_000);
    expect(mocks.uploadStrokesObject).toHaveBeenCalledTimes(2);
  });

  it('S37-4 루트 레이아웃의 드레인은 로그인했고 mvp-h 가 켜져 있을 때만 돈다', async () => {
    vi.stubEnv('NEXT_PUBLIC_MVPH_SLICE1', 'on');
    await enqueueStrokes(3, STROKES);
    mocks.uploadStrokesObject.mockResolvedValue(UPLOADED);
    mocks.attachStrokes.mockResolvedValue({ strokesPending: false });

    mocks.session.status = 'unauthenticated';
    const out = render(<StrokesOutboxDrain />);
    await new Promise((r) => setTimeout(r, 50));
    expect(mocks.uploadStrokesObject).not.toHaveBeenCalled();
    out.unmount();

    vi.stubEnv('NEXT_PUBLIC_MVPH_SLICE1', 'off');
    mocks.session.status = 'authenticated';
    const off = render(<StrokesOutboxDrain />);
    await new Promise((r) => setTimeout(r, 50));
    expect(mocks.uploadStrokesObject).not.toHaveBeenCalled();
    off.unmount();

    vi.stubEnv('NEXT_PUBLIC_MVPH_SLICE1', 'on');
    const on = render(<StrokesOutboxDrain />);
    await vi.waitFor(() =>
      expect(mocks.attachStrokes).toHaveBeenCalledWith(3, UPLOADED)
    );
    on.unmount();
  });
});
