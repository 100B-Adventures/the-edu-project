import {
  buildStrokesPayload,
  resolveLayout,
} from '@/entities/handwriting/infrastructure/handwriting.repository';
import { computeDiffMarks } from '@/features/solution-note/diff-marks';
import { submitSolutionNote } from '@/features/solution-note/submit-solution-note';
import type { Stroke } from '@/shared/components/drawing';
import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  upload: vi.fn(),
  create: vi.fn(),
}));

vi.mock('@/entities/handwriting', () => ({
  handwritingRepository: { uploadHandwriting: mocks.upload },
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

describe('시험 항목 S20 제출 뒤 풀이노트 만들기', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.upload.mockResolvedValue({ pngMediaId: 1 });
  });

  it('S20-1 손글씨를 올린 뒤 시도 번호와 멱등키로 풀이노트를 만들고 id 를 돌려준다', async () => {
    mocks.create.mockResolvedValue({ solutionNoteId: 9 });
    const id = await submitSolutionNote({
      attemptId: 21,
      strokes: [stroke('a', [0.2])],
      elapsedSeconds: 40,
      idempotencyKey: 'k1',
    });
    expect(id).toBe(9);
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ challengeAttemptId: 21, confirmEmpty: false }),
      'k1'
    );
  });

  it('S20-2 빈 제출은 confirmEmpty 를 켜서 보낸다', async () => {
    mocks.create.mockResolvedValue({ solutionNoteId: 10 });
    await submitSolutionNote({
      attemptId: 21,
      strokes: [],
      elapsedSeconds: 1,
      idempotencyKey: 'k2',
    });
    expect(mocks.create.mock.calls[0]![0].confirmEmpty).toBe(true);
  });

  it('S20-3 이미 만든 노트(409 SOLUTION_NOTE_ALREADY_EXISTS)는 에러 데이터의 id 로 이어 간다', async () => {
    const error = new AxiosError('conflict');
    error.response = {
      status: 409,
      data: {
        code: 'SOLUTION_NOTE_ALREADY_EXISTS',
        data: { solutionNoteId: 5 },
      },
    } as AxiosError['response'];
    mocks.create.mockRejectedValue(error);
    await expect(
      submitSolutionNote({
        attemptId: 21,
        strokes: [],
        elapsedSeconds: 1,
        idempotencyKey: 'k3',
      })
    ).resolves.toBe(5);
  });

  it('S20-4 다른 오류는 그대로 던져 호출한 쪽이 기존 결과 화면으로 이어 가게 한다', async () => {
    mocks.create.mockRejectedValue(new Error('500'));
    await expect(
      submitSolutionNote({
        attemptId: 21,
        strokes: [],
        elapsedSeconds: 1,
        idempotencyKey: 'k4',
      })
    ).rejects.toThrow('500');
  });
});
