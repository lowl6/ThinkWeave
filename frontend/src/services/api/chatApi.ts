// ============================================================
// ThinkWeave 对话消息API服务
// ============================================================

import client from './client';
import type { SendMessageRequest, SendMessageResponse } from '@/types/api';
import type { Message } from '@/types/models';

// TODO: 与后端确认消息API路径和格式

/**
 * 发送用户消息
 * TODO: 对接 POST /api/messages
 * TODO: 返回后AI响应通过WebSocket/SSE异步推送
 */
export async function sendMessage(
  data: SendMessageRequest
): Promise<SendMessageResponse> {
  const res = await client.post<SendMessageResponse>('/messages', data);
  return res.data;
}

/**
 * 获取房间消息历史
 * TODO: 对接 GET /api/rooms/:roomId/messages
 * TODO: 支持分页（page, pageSize）和时间范围筛选
 */
export async function getMessages(
  roomId: string,
  page = 1,
  pageSize = 50
): Promise<{ messages: Message[]; total: number }> {
  const res = await client.get(`/rooms/${roomId}/messages`, {
    params: { page, pageSize },
  });
  return res.data;
}

/**
 * 对消息打分
 * TODO: 对接 POST /api/messages/:messageId/score
 */
export async function scoreMessage(
  messageId: string,
  score: number
): Promise<void> {
  await client.post(`/messages/${messageId}/score`, { score });
}

/**
 * 采纳消息
 * TODO: 对接 POST /api/messages/:messageId/adopt
 */
export async function adoptMessage(messageId: string): Promise<void> {
  await client.post(`/messages/${messageId}/adopt`);
}

/**
 * 导出已采纳意见
 * TODO: 对接 GET /api/rooms/:roomId/adopted/export
 * TODO: 支持多种格式（markdown/pdf/json）
 */
export async function exportAdopted(
  roomId: string,
  format: 'markdown' | 'pdf' | 'json' = 'markdown'
): Promise<Blob> {
  const res = await client.get(`/rooms/${roomId}/adopted/export`, {
    params: { format },
    responseType: 'blob',
  });
  return res.data;
}
