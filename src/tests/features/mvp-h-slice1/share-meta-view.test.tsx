import {
  ShareMetaView,
  formatLessonDate,
} from '@/features/teaching-lesson/components/share-meta-view';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithQuery } from './helpers';

const mocks = vi.hoisted(() => ({ publicGet: vi.fn() }));

vi.mock('@/shared/api', () => ({
  api: { public: { get: mocks.publicGet }, private: { get: vi.fn() } },
}));

const META = {
  status: 200,
  message: 'ok',
  data: {
    title: '등차수열의 합',
    taughtAt: '2026-11-24T10:00:00',
    teacherName: '김선생',
    studyRoomName: '민서 1:1 수업',
    ogImageUrl: null,
    problemCount: 2,
    boardPhotoCount: 2,
    homeworkCount: 1,
  },
};

describe('시험 항목 S30 공유 페이지 메타 화면(FDD §8)', () => {
  beforeEach(() => mocks.publicGet.mockReset());

  it('S30-1 수업 날짜를 "2026.11.24 (화)" 로 보이고 세 개수를 그대로 보인다', async () => {
    mocks.publicGet.mockResolvedValue(META);
    renderWithQuery(<ShareMetaView token="TOK" />);
    expect(await screen.findByTestId('share-lesson-date')).toHaveTextContent(
      '2026.11.24 (화) 수업'
    );
    expect(
      screen.getByText(/같이 푼 문제 2 · 판서 사진 2 · 과제 1/)
    ).toBeInTheDocument();
    expect(screen.getByText('민서 1:1 수업 · 김선생')).toBeInTheDocument();
  });

  it('S30-2 로그인 안내 문장과 로그인 링크가 돌아올 경로(/s/토큰)를 들고 간다', async () => {
    mocks.publicGet.mockResolvedValue(META);
    renderWithQuery(<ShareMetaView token="TOK" />);
    await screen.findByTestId('share-login-prompt');
    expect(
      screen.getByText('로그인하면 수업노트 전체를 볼 수 있어요')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '로그인' })).toHaveAttribute(
      'href',
      `/login?redirect=${encodeURIComponent('/s/TOK')}`
    );
  });

  it('S30-3 날짜가 없거나 형식이 아니면 날짜 줄을 그리지 않는다', async () => {
    expect(formatLessonDate(null)).toBeNull();
    expect(formatLessonDate('내일')).toBeNull();
    mocks.publicGet.mockResolvedValue({
      ...META,
      data: { ...META.data, taughtAt: null },
    });
    renderWithQuery(<ShareMetaView token="TOK" />);
    await screen.findByTestId('share-login-prompt');
    expect(screen.queryByTestId('share-lesson-date')).toBeNull();
  });

  it('S30-4 열 수 없는 링크는 안내만 보이고 로그인 안내는 없다', async () => {
    // 서버가 404 SHARE_NOT_FOUND 봉투를 돌려주는 경우(만료·회수·없는 토큰 모두 같다)
    mocks.publicGet.mockResolvedValue({
      status: 404,
      message: 'SHARE_NOT_FOUND',
      data: null,
    });
    renderWithQuery(<ShareMetaView token="BAD" />);
    expect(await screen.findByText('열 수 없는 링크예요')).toBeInTheDocument();
    expect(screen.queryByTestId('share-login-prompt')).toBeNull();
  });
});
