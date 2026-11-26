import { api } from '@/shared/api';
import { unwrapEnvelope } from '@/shared/lib/api-utils';
import { z } from 'zod';

const pinSchema = z.object({
  id: z.number(),
  versionNo: z.number(),
  x: z.number(),
  y: z.number(),
  body: z.string(),
  status: z.enum(['OPEN', 'RESOLVED', 'HIDDEN']),
  authorKind: z.enum(['TEACHER', 'AI', 'STUDENT']),
  createdAt: z.string(),
});

const referenceSchema = z.object({
  id: z.number(),
  kind: z.enum(['TEACHING_NOTE', 'URL', 'MEDIA', 'TEXTBOOK', 'PRINT']),
  teachingNoteId: z.number().nullable(),
  url: z.string().nullable(),
  mediaId: z.number().nullable(),
  title: z.string(),
  anchor: z.string().nullable(),
});

const searchSchema = z.object({
  items: z.array(
    z.object({
      noteId: z.number(),
      pageId: z.number(),
      title: z.string(),
      nodeName: z.string(),
      matchedIn: z.string(),
      thumbMediaUrl: z.string().nullable(),
      revisionCount: z.number(),
      relatedToChallenge: z.boolean(),
    })
  ),
  page: z.number(),
  hasNext: z.boolean(),
});

export type NotePin = z.infer<typeof pinSchema>;
export type NoteReference = z.infer<typeof referenceSchema>;
export type NoteSearchItem = z.infer<typeof searchSchema>['items'][number];

export const collaborationApi = {
  search: async (q: string, tab: string, challengeId?: number) => {
    const response = await api.private.get('/student/unit-notes/search', {
      params: { q, tab, challengeId },
    });
    return unwrapEnvelope(response, searchSchema);
  },
  pins: async (pageId: number) => {
    const response = await api.private.get(
      `/student/unit-notes/pages/${pageId}/pins`
    );
    return unwrapEnvelope(response, z.array(pinSchema));
  },
  references: async (pageId: number) => {
    const response = await api.private.get(
      `/student/unit-notes/pages/${pageId}/references`
    );
    return unwrapEnvelope(response, z.array(referenceSchema));
  },
  addReference: async (
    pageId: number,
    input: {
      kind: 'URL' | 'TEXTBOOK' | 'PRINT';
      title: string;
      url?: string;
      anchor?: string;
    }
  ) => {
    const response = await api.private.post(
      `/student/unit-notes/pages/${pageId}/references`,
      input
    );
    return unwrapEnvelope(response, referenceSchema);
  },
  deleteReference: (pageId: number, referenceId: number) =>
    api.private.delete(
      `/student/unit-notes/pages/${pageId}/references/${referenceId}`
    ),
  saveVersion: async (
    nodeId: number,
    pageId: number,
    handwriting: string
  ) => {
    const response = await api.private.post(
      `/student/unit-notes/${nodeId}/pages/${pageId}/versions`,
      { kind: 'REVISION', handwriting }
    );
    return unwrapEnvelope(
      response,
      z.object({ id: z.number(), versionNo: z.number() })
    );
  },
};
