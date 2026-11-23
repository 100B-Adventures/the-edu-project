import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { SITE_CONFIG } from '@/config/site';
import { ShareMetaView } from '@/features/teaching-lesson/components/share-meta-view';
import {
  buildShareDescription,
  fetchShareMetaOnServer,
} from '@/features/teaching-lesson/server-share-meta';
import { isMvpHSliceEnabled } from '@/shared/lib/mvp-h-slice';

type PageProps = { params: Promise<{ token: string }> };

const getRequestOrigin = async () => {
  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') ?? headersList.get('host');
  const protocol = headersList.get('x-forwarded-proto') ?? 'https';
  return host ? `${protocol}://${host}` : SITE_CONFIG.url;
};

/** 카톡 미리보기(계약 §1.14): og:title, og:description, og:image 를 서버에서 공개 API 로 조회해 넣는다. */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  if (!isMvpHSliceEnabled()) return { title: SITE_CONFIG.name };
  const { token } = await params;
  const origin = await getRequestOrigin();
  const url = `${origin}/s/${token}`;
  const meta = await fetchShareMetaOnServer(token);
  if (!meta) return { title: `수업노트 | ${SITE_CONFIG.name}` };

  const title = meta.title?.trim()
    ? `${meta.title} | ${SITE_CONFIG.name}`
    : `수업노트 | ${SITE_CONFIG.name}`;
  const description = buildShareDescription(meta);
  const image = meta.ogImageUrl || `${url}/opengraph-image`;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: false, follow: false },
    openGraph: {
      locale: 'ko_KR',
      type: 'article',
      title,
      description,
      url,
      siteName: SITE_CONFIG.name,
      images: [{ url: image, width: 1200, height: 630, alt: '수업노트' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function TeachingNoteSharePage({ params }: PageProps) {
  // 기능 플래그가 꺼져 있으면 새 URL 도 열지 않는다(N-1).
  if (!isMvpHSliceEnabled()) notFound();
  const { token } = await params;
  return <ShareMetaView token={token} />;
}
