import { z } from 'zod';

const IdSchema = z.union([z.string(), z.number()]).transform(Number);

const NodeSchema = z.object({
  nodeId: IdSchema,
  parentId: IdSchema.nullable(),
  subject: z.string(),
  unit: z.string(),
  displayName: z.string(),
  depth: z.number(),
  pageCount: z.number(),
  penPageCount: z.number(),
  uploadPageCount: z.number(),
  teachingNoteCount: z.number(),
  relatedProblemCount: z.number(),
  masteryScore: z.number(),
  hintFreeSolveCount: z.number(),
  leafLevel: z.enum(['GRAY', 'LIT', 'DEEP']),
  /** 마지막 쪽을 올린 시각. 서버가 아직 안 주면 없다. */
  lastPageAt: z.string().nullable().optional().default(null),
  coverPage: z
    .object({
      pageId: IdSchema,
      source: z.enum(['PEN', 'UPLOAD', 'TEACHER']),
      fileName: z.string(),
      mimeType: z.string().nullable(),
      viewUrl: z.string().nullable(),
    })
    .nullable(),
});

const PageSchema = z.object({
  pageId: IdSchema,
  position: z.number(),
  source: z.enum(['PEN', 'UPLOAD', 'TEACHER']),
  fileName: z.string(),
  mimeType: z.string().nullable(),
  sizeBytes: z.number().nullable(),
  viewUrl: z.string().nullable(),
  cover: z.boolean(),
  hiddenByStudent: z.boolean().optional().default(false),
  teacherId: IdSchema.nullable().optional().default(null),
  teacherMemo: z.string().nullable().optional().default(null),
  createdAt: z.string().nullable(),
});

const TeachingLayerSchema = z.object({
  teachingNoteId: IdSchema,
  title: z.string(),
  summary: z.string(),
  taughtAt: z.string().nullable(),
});

const ProblemSchema = z.object({
  wrongAnswerId: IdSchema,
  title: z.string(),
  questionText: z.string(),
  sourceText: z.string(),
  reviewCount: z.number(),
  status: z.enum(['ACTIVE', 'GRADUATED', 'ARCHIVED']),
  nextReviewAt: z.string().nullable(),
});

const DetailSchema = z.object({
  nodeId: IdSchema,
  pages: z.array(PageSchema),
  teachingLayers: z.array(TeachingLayerSchema),
  relatedProblems: z.array(ProblemSchema),
});

const LibrarySchema = z.object({
  totalPages: z.number(),
  nodes: z.array(NodeSchema),
  detail: DetailSchema.nullable(),
});

const TeacherPageSchema = z.object({
  pageId: IdSchema,
  position: z.number(),
  source: z.enum(['PEN', 'UPLOAD', 'TEACHER']),
  fileName: z.string(),
  mimeType: z.string().nullable(),
  sizeBytes: z.number().nullable(),
  viewUrl: z.string().nullable(),
  cover: z.boolean(),
  teacherMemo: z.string().nullable(),
  createdAt: z.string().nullable(),
});

/** N7 전용 wire 계약을 기존 읽기 전용 뷰 모델로만 투영한다. */
const TeacherLibrarySchema = z
  .object({
    totalPages: z.number(),
    node: z.object({
      nodeId: IdSchema,
      displayName: z.string(),
      pageCount: z.number(),
    }),
    detail: z.object({
      nodeId: IdSchema,
      pages: z.array(TeacherPageSchema),
      teachingLayers: z.array(TeachingLayerSchema),
    }),
  })
  .transform(({ totalPages, node, detail }) => ({
    totalPages,
    nodes: [
      {
        nodeId: node.nodeId,
        parentId: null,
        subject: '',
        unit: '',
        displayName: node.displayName,
        depth: 0,
        pageCount: node.pageCount,
        penPageCount: 0,
        uploadPageCount: 0,
        teachingNoteCount: detail.teachingLayers.length,
        relatedProblemCount: 0,
        masteryScore: 0,
        hintFreeSolveCount: 0,
        leafLevel: node.pageCount > 0 ? ('LIT' as const) : ('GRAY' as const),
        lastPageAt: null,
        coverPage: null,
      },
    ],
    detail: {
      nodeId: detail.nodeId,
      pages: detail.pages.map((page) => ({
        ...page,
        hiddenByStudent: false,
        teacherId: null,
      })),
      teachingLayers: detail.teachingLayers,
      relatedProblems: [],
    },
  }));

const AppendPageSchema = z.object({
  source: z.enum(['PEN', 'UPLOAD']),
  mediaId: z.string().min(1),
  cover: z.boolean().default(false),
});

const AppendPayloadSchema = z.object({
  pages: z.array(AppendPageSchema).min(1),
});

const UpdatePayloadSchema = z
  .object({
    position: z.number().int().positive().optional(),
    cover: z.boolean().optional(),
    hidden: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.position !== undefined ||
      value.cover !== undefined ||
      value.hidden !== undefined,
    '변경할 페이지 속성이 필요합니다.'
  );

export const dto = {
  library: LibrarySchema,
  teacherLibrary: TeacherLibrarySchema,
};

export const payload = {
  append: AppendPayloadSchema,
  update: UpdatePayloadSchema,
};
