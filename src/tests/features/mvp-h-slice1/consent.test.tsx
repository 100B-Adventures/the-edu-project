import { HandwritingConsentDialog } from '@/features/solution-note/components/handwriting-consent-dialog';
import {
  getConsentRequired,
  submitSolutionNoteWithConsent,
} from '@/features/solution-note/submit-solution-note';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  upload: vi.fn(),
  create: vi.fn(),
  grant: vi.fn(),
}));

vi.mock('@/entities/handwriting', () => ({
  handwritingRepository: {
    uploadHandwriting: mocks.upload,
    grantConsent: mocks.grant,
  },
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

  it('S23-2 동의하면 동의를 POST 한 뒤 같은 제출을 다시 보낸다', async () => {
    mocks.create
      .mockRejectedValueOnce(consentError())
      .mockResolvedValueOnce({ solutionNoteId: 11 });
    mocks.grant.mockResolvedValue(undefined);
    const ask = vi.fn().mockResolvedValue(true);

    const id = await submitSolutionNoteWithConsent(input, ask);

    expect(id).toBe(11);
    expect(ask).toHaveBeenCalledWith('HANDWRITING_STORE');
    expect(mocks.grant).toHaveBeenCalledWith('HANDWRITING_STORE');
    expect(mocks.create).toHaveBeenCalledTimes(2);
    expect(mocks.create.mock.calls[1]![1]).toBe('sn-1-7');
  });

  it('S23-3 거절: 동의하지 않으면 동의를 보내지 않고 오류를 그대로 던진다', async () => {
    mocks.create.mockRejectedValue(consentError());
    const ask = vi.fn().mockResolvedValue(false);

    await expect(submitSolutionNoteWithConsent(input, ask)).rejects.toBeTruthy();
    expect(mocks.grant).not.toHaveBeenCalled();
    expect(mocks.create).toHaveBeenCalledTimes(1);
  });

  it('S23-4 동의 오류가 아닌 실패는 창을 묻지 않고 던진다', async () => {
    mocks.create.mockRejectedValue(new Error('서버 오류'));
    const ask = vi.fn();
    await expect(submitSolutionNoteWithConsent(input, ask)).rejects.toThrow();
    expect(ask).not.toHaveBeenCalled();
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
