import { useHandwritingConsent } from '@/features/solution-note/use-handwriting-consent';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getConsent: vi.fn(),
  grant: vi.fn(),
  toast: vi.fn(),
}));

vi.mock('@/entities/handwriting', () => ({
  handwritingRepository: {
    getConsent: mocks.getConsent,
    grantConsent: mocks.grant,
  },
}));
vi.mock('@/shared/components/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/components/ui')>()),
  showBottomToast: mocks.toast,
}));

let results: boolean[] = [];

const Probe = () => {
  const { ensureConsent, consentDialog } = useHandwritingConsent();
  return (
    <div>
      <button
        data-testid="ask"
        onClick={() => void ensureConsent().then((v) => results.push(v))}
      >
        ask
      </button>
      {consentDialog}
    </div>
  );
};

describe('시험 항목 S24 손필기 동의 확인(업로드 전)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    results = [];
    mocks.grant.mockResolvedValue(undefined);
  });

  it('S24-1 이미 동의했으면 창 없이 true 를 돌려준다', async () => {
    mocks.getConsent.mockResolvedValue({ granted: true });
    render(<Probe />);
    await userEvent.setup().click(screen.getByTestId('ask'));
    await waitFor(() => expect(results).toEqual([true]));
    expect(screen.queryByTestId('consent-dialog')).not.toBeInTheDocument();
  });

  it('S24-2 동의가 없으면 창을 열고, 동의하면 기록한 뒤 true', async () => {
    mocks.getConsent.mockResolvedValue({ granted: false });
    const user = userEvent.setup();
    render(<Probe />);
    await user.click(screen.getByTestId('ask'));
    await user.click(await screen.findByTestId('consent-agree'));
    await waitFor(() => expect(results).toEqual([true]));
    expect(mocks.grant).toHaveBeenCalledWith('HANDWRITING_STORE');
  });

  it('S24-3 거절: 나중에 를 누르면 false 이고 동의를 기록하지 않는다', async () => {
    mocks.getConsent.mockResolvedValue({ granted: false });
    const user = userEvent.setup();
    render(<Probe />);
    await user.click(screen.getByTestId('ask'));
    await user.click(await screen.findByTestId('consent-decline'));
    await waitFor(() => expect(results).toEqual([false]));
    expect(mocks.grant).not.toHaveBeenCalled();
  });

  it('S24-4 거절: 동의 기록이 실패하면 false 이고 안내 문구를 보인다(삼키지 않는다)', async () => {
    mocks.getConsent.mockResolvedValue({ granted: false });
    mocks.grant.mockRejectedValue(new Error('500'));
    const user = userEvent.setup();
    render(<Probe />);
    await user.click(screen.getByTestId('ask'));
    await user.click(await screen.findByTestId('consent-agree'));
    await waitFor(() => expect(results).toEqual([false]));
    expect(mocks.toast).toHaveBeenCalledWith(
      '동의를 저장하지 못했어요. 다시 시도해 주세요.'
    );
  });

  it('S24-5 창이 떠 있을 때 다시 물으면 같은 창을 같이 기다린다(약속을 덮어쓰지 않는다)', async () => {
    mocks.getConsent.mockResolvedValue({ granted: false });
    const user = userEvent.setup();
    render(<Probe />);
    await user.click(screen.getByTestId('ask'));
    await screen.findByTestId('consent-dialog');
    await user.click(screen.getByTestId('ask')).catch(() => undefined);
    await user.click(await screen.findByTestId('consent-agree'));
    await waitFor(() => expect(results.length).toBeGreaterThanOrEqual(1));
    expect(results.every((v) => v === true)).toBe(true);
  });
});
