import { dto, payload } from '@/entities/unit-note';
import { describe, expect, it } from 'vitest';

describe('unit-note DTO contract', () => {
  it('개념 트리와 선택 소단원 지층을 함께 파싱한다', () => {
    const parsed = dto.library.parse({
      totalPages: 3,
      nodes: [
        {
          nodeId: 11,
          parentId: 10,
          subject: 'MATH_1',
          unit: 'mathematical_induction',
          displayName: '수학적 귀납법',
          depth: 1,
          pageCount: 3,
          penPageCount: 1,
          uploadPageCount: 2,
          teachingNoteCount: 2,
          relatedProblemCount: 2,
          masteryScore: 30,
          hintFreeSolveCount: 1,
          leafLevel: 'DEEP',
          coverPage: {
            pageId: 101,
            source: 'PEN',
            fileName: '내 노트.png',
            mimeType: 'image/png',
            viewUrl: 'https://example.test/note.png',
          },
        },
      ],
      detail: {
        nodeId: 11,
        pages: [
          {
            pageId: 101,
            position: 1,
            source: 'PEN',
            fileName: '내 노트.png',
            mimeType: 'image/png',
            sizeBytes: 1024,
            viewUrl: 'https://example.test/note.png',
            cover: true,
            createdAt: '2026-07-31T10:00:00',
          },
        ],
        teachingLayers: [],
        relatedProblems: [],
      },
    });

    expect(parsed.nodes[0]?.nodeId).toBe(11);
    expect(parsed.detail?.pages[0]?.source).toBe('PEN');
  });

  it('빈 append와 변경 속성 없는 update를 거부한다', () => {
    expect(() => payload.append.parse({ pages: [] })).toThrow();
    expect(() => payload.update.parse({})).toThrow();
  });

  it('선생님 N7 단원 단건 응답은 오답과 숙련도 없이 읽기 뷰로 투영한다', () => {
    const parsed = dto.teacherLibrary.parse({
      totalPages: 1,
      node: { nodeId: 11, displayName: '수학적 귀납법', pageCount: 1 },
      detail: {
        nodeId: 11,
        pages: [
          {
            pageId: 101,
            position: 1,
            source: 'UPLOAD',
            fileName: '노트.png',
            mimeType: 'image/png',
            sizeBytes: 1024,
            viewUrl: 'https://example.test/note.png',
            cover: true,
            teacherMemo: null,
            createdAt: '2026-11-25T20:00:00',
          },
        ],
        teachingLayers: [],
      },
    });
    expect(parsed.nodes).toHaveLength(1);
    expect(parsed.detail?.relatedProblems).toEqual([]);
    expect(parsed.detail?.pages[0]?.hiddenByStudent).toBe(false);
  });
});
