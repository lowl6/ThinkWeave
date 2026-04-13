// ============================================================
// ThinkWeave 文件/知识库上传API服务
// ============================================================

import client from './client';
import type { UploadFileResponse } from '@/types/api';

/**
 * 上传知识库文件
 * TODO: 对接 POST /api/files/upload
 * TODO: 使用 multipart/form-data 格式
 * TODO: 添加上传进度回调
 */
export async function uploadFile(
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadFileResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await client.post<UploadFileResponse>('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (event.total && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    },
  });
  return res.data;
}

/**
 * 删除已上传文件
 * TODO: 对接 DELETE /api/files/:fileId
 */
export async function deleteFile(fileId: string): Promise<void> {
  await client.delete(`/files/${fileId}`);
}

/**
 * 获取文件列表
 * TODO: 对接 GET /api/rooms/:roomId/files
 */
export async function getRoomFiles(
  roomId: string
): Promise<UploadFileResponse[]> {
  const res = await client.get(`/rooms/${roomId}/files`);
  return res.data;
}
