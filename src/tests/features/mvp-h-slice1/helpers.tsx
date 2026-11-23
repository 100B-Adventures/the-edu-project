import type { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';

export const renderWithQuery = (ui: ReactNode) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>
  );
};

export const OVERVIEW = {
  today: '2026-11-23',
  reviewDay: 12,
  me: { level: 4, exp: 320, expToNext: 180, source: 'LEVEL' },
  quest: {
    expReward: 70,
    items: [
      {
        position: 1,
        wrongAnswerId: 501,
        challengeId: 11,
        title: '등차수열의 합',
        dueLabel: '오늘',
        thumbUrl: 'https://img.example/q.png',
        unitTitle: '수열',
        stuckReasonLabel: '오래 걸림',
        expReward: 20,
        solvedStatus: 'PENDING',
        origin: { kind: 'CLASS', label: '수업' },
      },
    ],
  },
  curve: {
    buckets: [
      { intervalDays: 1, count: 2 },
      { intervalDays: 3, count: 1 },
    ],
    dueNow: 3,
    soonForget: { tomorrow: 2, dayAfter: 1 },
  },
  situation: { total: 3, byReason: { TOOK_LONG: 2, CONCEPT_GAP: 1 } },
  unit: [
    { treeNodeId: 9, name: '수열', count: 3, dueNow: 2, byReviewCount: [1, 2] },
  ],
};

export const CARD = {
  wrongAnswerId: 501,
  challengeId: 11,
  title: '등차수열의 합',
  unitName: '수열',
  thumbUrl: null,
  reasons: ['TOOK_LONG'],
  reasonText: '오래 걸림',
  dueBadge: { kind: 'DUE_NOW', label: '지금' },
  reviewCount: 2,
  maxReviews: 5,
  origin: { kind: 'CLASS', label: '수업' },
};
