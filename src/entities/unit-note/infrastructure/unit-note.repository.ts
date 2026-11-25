import type {
  AppendUnitNotePagesPayload,
  UnitNoteLibrary,
  UnitNoteUploadResult,
  UpdateUnitNotePagePayload,
} from '@/entities/unit-note/types';
import { api } from '@/shared/api';
import type { PresignBatchResponse } from '@/shared/components/editor';
import { unwrapEnvelope } from '@/shared/lib/api-utils';

import { dto, payload } from './unit-note.dto';

const getLibrary = async (nodeId?: number): Promise<UnitNoteLibrary> => {
  const response = await api.private.get('/student/unit-notes', {
    params: nodeId ? { nodeId } : undefined,
  });
  return unwrapEnvelope(response, dto.library);
};

/** N7: 같은 방 학생의 노트를 선생님이 읽는다(읽기 전용). 방이 다르면 서버가 403 을 준다. */
const getStudentLibrary = async (
  studentId: number,
  nodeId: number
): Promise<UnitNoteLibrary> => {
  const response = await api.private.get(
    `/teacher/students/${studentId}/unit-notes`,
    { params: { nodeId } }
  );
  return unwrapEnvelope(response, dto.teacherLibrary);
};

const appendPages = async (
  nodeId: number,
  input: AppendUnitNotePagesPayload
): Promise<UnitNoteLibrary> => {
  const validated = payload.append.parse(input);
  const response = await api.private.post(
    `/student/unit-notes/${nodeId}/pages`,
    validated
  );
  return unwrapEnvelope(response, dto.library);
};

const updatePage = async (
  nodeId: number,
  pageId: number,
  input: UpdateUnitNotePagePayload
): Promise<UnitNoteLibrary> => {
  const validated = payload.update.parse(input);
  const response = await api.private.patch(
    `/student/unit-notes/${nodeId}/pages/${pageId}`,
    validated
  );
  return unwrapEnvelope(response, dto.library);
};

const deletePage = async (
  nodeId: number,
  pageId: number
): Promise<UnitNoteLibrary> => {
  const response = await api.private.delete(
    `/student/unit-notes/${nodeId}/pages/${pageId}`
  );
  return unwrapEnvelope(response, dto.library);
};

const uploadPageFile = async (file: File): Promise<UnitNoteUploadResult> => {
  const response = await api.private.post<PresignBatchResponse>(
    '/common/media/presign-batch',
    {
      mediaAssetList: [
        {
          fileName: file.name,
          contentType: file.type,
          sizeBytes: file.size,
          targetType: 'UNIT_NOTE_PAGE',
        },
      ],
    }
  );
  const mediaAsset = response.data.mediaAssetList[0];
  if (!mediaAsset) {
    throw new Error('페이지 업로드 정보를 받지 못했습니다.');
  }
  const uploadResponse = await fetch(mediaAsset.uploadUrl, {
    method: 'PUT',
    headers: mediaAsset.headers,
    body: file,
  });
  if (!uploadResponse.ok) {
    throw new Error(`${file.name} 업로드에 실패했습니다.`);
  }
  return {
    mediaId: mediaAsset.mediaId,
    fileName: file.name,
    sizeBytes: file.size,
  };
};

export const repository = {
  getLibrary,
  getStudentLibrary,
  appendPages,
  updatePage,
  deletePage,
  uploadPageFile,
};
