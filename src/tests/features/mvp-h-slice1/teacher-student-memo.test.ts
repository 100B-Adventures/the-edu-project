import { teachingNoteRepository } from '@/entities/teaching-note';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/shared/api', () => ({ api: { private: { get: mocks.get } } }));

describe('시험 항목 S32 선생님이 방 학생 한 명의 메모를 읽는다 (교차 리뷰 P1-11)', () => {
  beforeEach(() => mocks.get.mockReset());

  it('S32-1 학생 id 를 쿼리로 보낸다', async () => {
    mocks.get.mockResolvedValue({
      status: 200,
      message: 'ok',
      data: {
        nextLesson: null,
        weekly: null,
        teacherNote: null,
        myMemo: '메모',
      },
    });
    const info = await teachingNoteRepository.getTeacherLessonInfo(4, 9);
    expect(mocks.get).toHaveBeenCalledWith(
      '/teacher/study-rooms/4/lesson-info',
      { params: { studentId: 9 } }
    );
    expect(info.myMemo).toBe('메모');
  });

  it('S32-2 학생 id 가 없으면 쿼리 없이 부른다(기존 동작 유지)', async () => {
    mocks.get.mockResolvedValue({
      status: 200,
      message: 'ok',
      data: {
        nextLesson: null,
        weekly: null,
        teacherNote: null,
        myMemo: null,
      },
    });
    await teachingNoteRepository.getTeacherLessonInfo(4);
    expect(mocks.get).toHaveBeenCalledWith(
      '/teacher/study-rooms/4/lesson-info',
      undefined
    );
  });
});
