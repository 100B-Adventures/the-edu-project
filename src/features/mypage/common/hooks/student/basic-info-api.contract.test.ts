import { repository as studentRepository } from '@/entities/student';
import { repository as teacherRepository } from '@/entities/teacher';
import { api } from '@/shared/api';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('S13 학생 마이 기본정보 실 API 계약', () => {
  afterEach(() => vi.restoreAllMocks());

  it('저장 후 다시 열면 GET/PATCH 실 endpoint와 서버 응답을 그대로 사용한다', async () => {
    const get = vi
      .spyOn(api.private, 'get')
      .mockResolvedValueOnce({
        status: 200,
        message: '성공',
        data: {
          name: '김서준',
          email: 'student@example.com',
          profileImageUrl: null,
          isProfilePublic: true,
          learningGoal: '오답 5개 다시 풀기',
        },
      })
      .mockResolvedValueOnce({
        status: 200,
        message: '성공',
        data: {
          name: '김서준',
          email: 'student@example.com',
          profileImageUrl: null,
          isProfilePublic: false,
          learningGoal: '오답 10개 다시 풀기',
        },
      });
    const patch = vi
      .spyOn(api.private, 'patch')
      .mockResolvedValue({ status: 200, message: '성공', data: null });

    const before = await studentRepository.mypage.basicInfo.getBasicInfo();
    await studentRepository.mypage.basicInfo.updateBasicInfo({
      name: before.name,
      isProfilePublic: false,
      learningGoal: '오답 10개 다시 풀기',
    });
    const reopened = await studentRepository.mypage.basicInfo.getBasicInfo();

    expect(get).toHaveBeenNthCalledWith(1, '/student/me/basic-info');
    expect(patch).toHaveBeenCalledWith('/student/me/basic-info', {
      name: '김서준',
      isProfilePublic: false,
      learningGoal: '오답 10개 다시 풀기',
    });
    expect(get).toHaveBeenNthCalledWith(2, '/student/me/basic-info');
    expect(reopened).toMatchObject({
      name: '김서준',
      isProfilePublic: false,
      learningGoal: '오답 10개 다시 풀기',
      profilePublicKorean: '비공개',
    });
  });

  it('선생님 기본 계정도 수업 설정과 분리된 GET/PATCH endpoint를 사용한다', async () => {
    const get = vi.spyOn(api.private, 'get').mockResolvedValue({
      status: 200,
      message: '성공',
      data: {
        name: '한지원',
        email: 'teacher@example.com',
        profileImageUrl: null,
        isProfilePublic: true,
        isEmailPublic: false,
        simpleIntroduction: '수학을 함께 이해해요.',
      },
    });
    const patch = vi
      .spyOn(api.private, 'patch')
      .mockResolvedValue({ status: 200, message: '성공', data: null });

    const basicInfo = await teacherRepository.basicInfo.getBasicInfo();
    await teacherRepository.basicInfo.updateBasicInfo({
      name: basicInfo.name,
      isProfilePublic: basicInfo.isProfilePublic,
      isEmailPublic: true,
      simpleIntroduction: basicInfo.simpleIntroduction ?? '',
    });

    expect(get).toHaveBeenCalledWith('/teacher/me/basic-info');
    expect(patch).toHaveBeenCalledWith('/teacher/me/basic-info', {
      name: '한지원',
      isProfilePublic: true,
      isEmailPublic: true,
      simpleIntroduction: '수학을 함께 이해해요.',
    });
  });
});
