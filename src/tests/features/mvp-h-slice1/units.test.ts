import {
  buildStrokesPayload,
  resolveLayout,
} from '@/entities/handwriting/infrastructure/handwriting.repository';
import { computeDiffMarks } from '@/features/solution-note/diff-marks';
import { submitSolutionNote } from '@/features/solution-note/submit-solution-note';
import type { Stroke } from '@/shared/components/drawing';
import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: async () => ({ getAll: () => [] }),
}));

const mocks = vi.hoisted(() => ({
  upload: vi.fn(),
  create: vi.fn(),
}));

vi.mock('@/entities/handwriting', () => ({
  handwritingRepository: { uploadHandwriting: mocks.upload },
  settleDeferredStrokes: vi.fn(),
}));
vi.mock('@/entities/solution-note', () => ({
  solutionNoteRepository: { create: mocks.create },
}));

const stroke = (id: string, ys: number[]): Stroke => ({
  id,
  pageNumber: 0,
  color: '#000000',
  size: 3,
  tool: 'pen',
  points: ys.map((y) => ({ x: 0.5, y })),
});

describe('시험 항목 S19 손글씨 저장과 고친 곳 계산', () => {
  it('S19-1 새로 쓴 획만 모아 세로 구간(0~1)으로 돌려준다', () => {
    const base = [stroke('a', [0.1, 0.2])];
    const next = [...base, stroke('b', [0.5, 0.6]), stroke('c', [0.61, 0.7])];
    expect(computeDiffMarks(base, next)).toEqual([{ y0: 0.5, y1: 0.7 }]);
  });

  it('S19-2 바뀐 획이 없으면 빈 구간을 돌려준다', () => {
    const base = [stroke('a', [0.1])];
    expect(computeDiffMarks(base, base)).toEqual([]);
  });

  it('S19-3 획 JSON 은 스키마 버전과 레이아웃 크기를 포함하고 크기 없는 획은 기본 크기를 쓴다', () => {
    const payload = buildStrokesPayload([stroke('a', [0.1])]);
    expect(payload.schemaVersion).toBe(1);
    expect(resolveLayout([])).toEqual({
      layoutWidth: 1024,
      layoutHeight: 1400,
    });
    expect(payload.strokes).toHaveLength(1);
  });
});

const ensureOk = vi.fn().mockResolvedValue(true);

describe('시험 항목 S20 제출 뒤 풀이노트 만들기', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureOk.mockResolvedValue(true);
    mocks.upload.mockResolvedValue({ pngMediaId: 1 });
  });

  it('S20-1 손글씨를 올린 뒤 시도 번호와 멱등키로 풀이노트를 만들고 id 를 돌려준다', async () => {
    mocks.create.mockResolvedValue({ solutionNoteId: 9 });
    const id = await submitSolutionNote(
      {
        attemptId: 21,
        strokes: [stroke('a', [0.2])],
        elapsedSeconds: 40,
        idempotencyKey: 'k1',
      },
      ensureOk
    );
    expect(id).toEqual({ solutionNoteId: 9, strokesSaved: true });
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ challengeAttemptId: 21, confirmEmpty: false }),
      'k1'
    );
  });

  it('S20-2 빈 제출은 confirmEmpty 를 켜서 보낸다', async () => {
    mocks.create.mockResolvedValue({ solutionNoteId: 10 });
    await submitSolutionNote(
      {
        attemptId: 21,
        strokes: [],
        elapsedSeconds: 1,
        idempotencyKey: 'k2',
      },
      ensureOk
    );
    expect(mocks.create.mock.calls[0]![0].confirmEmpty).toBe(true);
  });

  it('S20-3 이미 만든 노트(409 SOLUTION_NOTE_ALREADY_EXISTS)는 BFF 를 지난 응답의 data id 로 이어 간다', async () => {
    // 실제 BFF 라우트를 거친 응답 본문을 axios 오류에 실어 보낸다(BFF 가 data 를 지우면 이 시험이 실패한다).
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              code: 'SOLUTION_NOTE_ALREADY_EXISTS',
              message: '이미 있어요',
              data: { solutionNoteId: 5 },
            }),
            { status: 409, headers: { 'Content-Type': 'application/json' } }
          )
      )
    );
    const route = await import('@/app/api/v1/[...path]/route');
    const { NextRequest } = await import('next/server');
    const bff = await route.POST(
      new NextRequest('https://dev.d-edu.site/api/v1/student/solution-notes', {
        method: 'POST',
        headers: { 'Idempotency-Key': 'k3' },
        body: '{}',
      }),
      { params: Promise.resolve({ path: ['student', 'solution-notes'] }) }
    );
    const error = new AxiosError('conflict');
    error.response = {
      status: bff.status,
      data: await bff.json(),
    } as AxiosError['response'];
    mocks.create.mockRejectedValue(error);
    await expect(
      submitSolutionNote(
        {
          attemptId: 21,
          strokes: [],
          elapsedSeconds: 1,
          idempotencyKey: 'k3',
        },
        ensureOk
      )
    ).resolves.toEqual({ solutionNoteId: 5, strokesSaved: true });
    vi.unstubAllGlobals();
  });

  it('S20-4 다른 오류는 그대로 던져 호출한 쪽이 기존 결과 화면으로 이어 가게 한다', async () => {
    mocks.create.mockRejectedValue(new Error('500'));
    await expect(
      submitSolutionNote(
        {
          attemptId: 21,
          strokes: [],
          elapsedSeconds: 1,
          idempotencyKey: 'k4',
        },
        ensureOk
      )
    ).rejects.toThrow('500');
  });
});
