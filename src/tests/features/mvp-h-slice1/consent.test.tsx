import { HandwritingConsentDialog } from '@/features/solution-note/components/handwriting-consent-dialog';
import {
  getConsentRequired,
  submitSolutionNote,
} from '@/features/solution-note/submit-solution-note';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  upload: vi.fn(),
  create: vi.fn(),
  grant: vi.fn(),
  settle: vi.fn(),
}));

vi.mock('@/entities/handwriting', () => ({
  handwritingRepository: {
    uploadHandwriting: mocks.upload,
    grantConsent: mocks.grant,
  },
  settleDeferredStrokes: mocks.settle,
}));
vi.mock('@/entities/solution-note', () => ({
  solutionNoteRepository: { create: mocks.create },
}));

const consentError = () =>
  new AxiosError('x', '400', undefined, undefined, {
    status: 400,
    data: {
      code: 'CONSENT_REQUIRED',
      data: {
        consentType: 'HANDWRITING_STORE',
        currentVersion: 'v1',
        grantEndpoint: '/api/student/consents',
      },
    },
    statusText: '',
    headers: {},
    config: {} as never,
  });

const input = {
  attemptId: 7,
  strokes: [],
  elapsedSeconds: 30,
  idempotencyKey: 'sn-1-7',
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.upload.mockResolvedValue({ pngMediaId: 1 });
});

describe('시험 항목 S23 손필기 저장 동의 흐름', () => {
  it('S23-1 CONSENT_REQUIRED 응답에서 동의 종류를 읽는다', () => {
    expect(getConsentRequired(consentError())).toEqual({
      consentType: 'HANDWRITING_STORE',
    });
    expect(getConsentRequired(new Error('다른 오류'))).toBeNull();
  });

  it('S23-2 동의가 이미 있으면 창 없이 업로드하고 노트를 만든다', async () => {
    mocks.create.mockResolvedValue({ solutionNoteId: 11 });
    const ensure = vi.fn().mockResolvedValue(true);
    const result = await submitSolutionNote(input, ensure);
    expect(result).toEqual({ solutionNoteId: 11, strokesSaved: true });
    expect(ensure).toHaveBeenCalledTimes(1);
    expect(mocks.upload).toHaveBeenCalledTimes(1);
  });

  it('S23-3 동의를 못 받으면 획 좌표는 올리지 않고 PNG 만으로 노트를 만든다 (교차 리뷰 P1-8)', async () => {
    mocks.create.mockResolvedValue({ solutionNoteId: 13 });
    const ensure = vi.fn().mockResolvedValue(false);
    const result = await submitSolutionNote(input, ensure);
    expect(result).toEqual({ solutionNoteId: 13, strokesSaved: false });
    expect(mocks.upload).toHaveBeenCalledTimes(1);
    expect(mocks.upload).toHaveBeenCalledWith(
      expect.objectContaining({ pngOnly: true })
    );
    expect(mocks.create).toHaveBeenCalledTimes(1);
    // 획 보관함에도 넣지 않는다(동의 없는 획을 로컬에 남기지 않는다).
    expect(mocks.settle).not.toHaveBeenCalled();
  });

  it('S23-4 서버가 그래도 CONSENT_REQUIRED 를 주면 다시 묻고, 올려 둔 손글씨를 재사용해 한 번 더 보낸다', async () => {
    mocks.create
      .mockRejectedValueOnce(consentError())
      .mockResolvedValueOnce({ solutionNoteId: 12 });
    const ensure = vi.fn().mockResolvedValue(true);
    const result = await submitSolutionNote(input, ensure);
    expect(result.solutionNoteId).toBe(12);
    expect(ensure).toHaveBeenNthCalledWith(2, true);
    expect(mocks.upload).toHaveBeenCalledTimes(1);
    expect(mocks.create).toHaveBeenCalledTimes(2);
  });

  it('S23-5 서버가 동의를 다시 요구했는데 거절하면 PNG 만으로 다시 보낸다', async () => {
    mocks.create
      .mockRejectedValueOnce(consentError())
      .mockResolvedValueOnce({ solutionNoteId: 14 });
    const ensure = vi
      .fn()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    const result = await submitSolutionNote(input, ensure);
    expect(result).toEqual({ solutionNoteId: 14, strokesSaved: false });
    expect(mocks.upload).toHaveBeenLastCalledWith(
      expect.objectContaining({ pngOnly: true })
    );
  });

  it('S23-6 동의 오류가 아닌 실패는 창을 다시 묻지 않고 던진다', async () => {
    mocks.create.mockRejectedValue(new Error('서버 오류'));
    const ensure = vi.fn().mockResolvedValue(true);
    await expect(submitSolutionNote(input, ensure)).rejects.toThrow(
      '서버 오류'
    );
    expect(ensure).toHaveBeenCalledTimes(1);
  });

  it('S23-5 동의 창은 동의·나중에 버튼이 각각 한 번씩 동작한다', async () => {
    const user = userEvent.setup();
    const onAgree = vi.fn();
    const onDecline = vi.fn();
    render(
      <HandwritingConsentDialog
        isOpen
        isPending={false}
        onAgree={onAgree}
        onDecline={onDecline}
      />
    );
    await user.click(screen.getByTestId('consent-agree'));
    await user.click(screen.getByTestId('consent-decline'));
    expect(onAgree).toHaveBeenCalledTimes(1);
    expect(onDecline).toHaveBeenCalledTimes(1);
  });
});
