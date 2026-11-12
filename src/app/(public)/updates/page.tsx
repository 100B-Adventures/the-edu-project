import type { Metadata } from 'next';

import { Footer } from '@/layout/footer';
import { PUBLIC_RELEASE_NOTES } from '@/shared/lib/release-notes';

export const metadata: Metadata = {
  title: '업데이트 소식 | 오독공',
  description: '오독공의 새로운 기능과 개선 내용을 버전별로 확인합니다.',
};

export default function UpdatesPage() {
  return (
    <>
      <main className="mx-auto min-h-[60vh] max-w-reading px-5 py-12">
        <header className="mb-room-gap">
          <p className="font-label-heading text-key-color-primary mb-content-gap">
            계속 좋아지고 있어요
          </p>
          <h1 className="font-title-heading text-text-main mb-content-gap">
            업데이트 소식
          </h1>
          <p className="font-body2-normal text-text-sub2 break-keep">
            새로 추가한 기능과 사용하면서 불편했던 점을 고친 기록입니다.
          </p>
        </header>

        <ol className="space-y-block-gap" aria-label="버전별 업데이트">
          {PUBLIC_RELEASE_NOTES.map((note) => (
            <li key={note.version}>
              <article className="border-line-line1 rounded-card p-card-pad border bg-white">
                <p className="font-caption-normal text-text-sub2 mb-content-gap tabular-nums">
                  {note.version} · {note.date}
                </p>
                <h2 className="font-headline2-heading text-text-main mb-content-gap break-keep">
                  {note.title}
                </h2>
                <div className="font-body2-normal text-text-sub2 space-y-content-gap break-keep">
                  {note.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </article>
            </li>
          ))}
        </ol>
      </main>
      <Footer />
    </>
  );
}
