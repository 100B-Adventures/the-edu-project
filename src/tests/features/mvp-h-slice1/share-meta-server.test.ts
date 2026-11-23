import {
  buildShareDescription,
  fetchShareMetaOnServer,
} from '@/features/teaching-lesson/server-share-meta';
import { afterEach, describe, expect, it, vi } from 'vitest';

const body = {
  status: 200,
  message: 'ok',
  data: {
    title: '미분 수업',
    taughtAt: '2026-11-24T19:00:00',
    teacherName: '선생님',
    studyRoomName: '1:1',
    ogImageUrl: null,
    problemCount: 3,
    boardPhotoCount: 2,
    homeworkCount: 1,
  },
};

describe('시험 항목 S29 공유 링크 서버 메타(M-8)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('S29-1 공개 API 응답으로 날짜·판서·문제·과제 수 설명을 만든다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }))
    );
    const meta = await fetchShareMetaOnServer('abc');
    expect(meta?.title).toBe('미분 수업');
    expect(buildShareDescription(meta!)).toBe(
      '2026.11.24 · 판서 2장 · 문제 3개 · 과제 1개'
    );
  });

  it('S29-2 거절: 만료·없는 링크(404)와 네트워크 실패는 null 이다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 404 }))
    );
    expect(await fetchShareMetaOnServer('gone')).toBeNull();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('net');
      })
    );
    expect(await fetchShareMetaOnServer('x')).toBeNull();
  });
});
