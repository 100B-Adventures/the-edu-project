import { dto } from '@/entities/teaching-note/infrastructure/teaching-note.dto';
import { serverEnv } from '@/shared/constants/api/config.env';
import { unwrapEnvelope } from '@/shared/lib/api-utils';

/**
 * 공유 링크 메타를 서버에서 공개 API 로 조회한다(GET /api/public/teaching-note-shares/{token}).
 * 카톡·메신저 크롤러는 JS 를 실행하지 않으므로 og 메타는 서버에서 만들어야 한다.
 * 만료·없는 링크·네트워크 실패는 null 이다(메타는 기본값으로 떨어진다).
 */
export const fetchShareMetaOnServer = async (token: string) => {
  try {
    const response = await fetch(
      `${serverEnv.backendApiUrl}/public/teaching-note-shares/${encodeURIComponent(token)}`,
      { headers: { Accept: 'application/json' }, cache: 'no-store' }
    );
    if (!response.ok) return null;
    return unwrapEnvelope(await response.json(), dto.shareMeta);
  } catch {
    return null;
  }
};

const formatTaughtAt = (iso: string | null | undefined) => {
  if (!iso) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return match ? `${match[1]}.${match[2]}.${match[3]}` : null;
};

/** og:description: 날짜, 판서 수, 문제 수, 과제 수 */
export const buildShareDescription = (
  meta: NonNullable<Awaited<ReturnType<typeof fetchShareMetaOnServer>>>
) => {
  const date = formatTaughtAt(meta.taughtAt);
  const parts = [
    date,
    `판서 ${meta.boardPhotoCount}장`,
    `문제 ${meta.problemCount}개`,
    `과제 ${meta.homeworkCount}개`,
  ].filter(Boolean);
  return parts.join(' · ');
};
