import { OG_PRESETS, createOgImage } from '@/shared/lib/og';

export function GET(request: Request) {
  return createOgImage({
    preset: OG_PRESETS.STUDY_NOTE,
    origin: new URL(request.url).origin,
  });
}
