import { shellKeys, shellRepository } from '@/entities/shell';
import { useQuery } from '@tanstack/react-query';

const FIVE_MINUTES = 1000 * 60 * 5;

/** N1: 학생 트랙과 대표 방. 학생일 때만 읽고, 한 번 읽으면 5분 쓴다(틀이 화면마다 다시 읽지 않게). */
export const useShellTrackQuery = (enabled: boolean) =>
  useQuery({
    queryKey: shellKeys.track(),
    queryFn: shellRepository.getTrack,
    enabled,
    staleTime: FIVE_MINUTES,
  });
