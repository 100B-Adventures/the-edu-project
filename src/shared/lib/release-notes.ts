import releaseNotesJson from '@/generated/release-notes.json';

export type PublicReleaseNote = {
  version: string;
  date: string;
  title: string;
  body: string[];
  notify: boolean;
  try_href: string;
};

export const PUBLIC_RELEASE_NOTES =
  releaseNotesJson as PublicReleaseNote[];

export const CURRENT_PUBLIC_RELEASE_NOTE = PUBLIC_RELEASE_NOTES[0];
