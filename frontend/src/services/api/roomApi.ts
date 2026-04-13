// ============================================================
// ThinkWeave 房间API服务
// ============================================================

import client from './client';
import type {
  CreateRoomRequest,
  CreateRoomResponse,
  JoinRoomRequest,
} from '@/types/api';
import type { Room } from '@/types/models';

// TODO: 与后端确认所有API路径和请求/响应格式

/**
 * 创建研讨房间
 * TODO: 对接 POST /api/rooms
 */
export async function createRoom(
  data: CreateRoomRequest
): Promise<Room> {
  const res = await client.post<CreateRoomResponse>('/rooms', data);
  return res.data.room;
}

/**
 * 通过房间号加入房间
 * TODO: 对接 POST /api/rooms/join
 */
export async function joinRoom(
  data: JoinRoomRequest
): Promise<Room> {
  const res = await client.post<{ room: Room }>('/rooms/join', data);
  return res.data.room;
}

/**
 * 获取房间详情
 * TODO: 对接 GET /api/rooms/:roomId
 */
export async function getRoom(roomId: string): Promise<Room> {
  const res = await client.get<{ room: Room }>(`/rooms/${roomId}`);
  return res.data.room;
}

/**
 * 更新房间配置
 * TODO: 对接 PATCH /api/rooms/:roomId
 */
export async function updateRoom(
  roomId: string,
  data: Partial<Room>
): Promise<Room> {
  const res = await client.patch<{ room: Room }>(`/rooms/${roomId}`, data);
  return res.data.room;
}

/**
 * 离开房间
 * TODO: 对接 POST /api/rooms/:roomId/leave
 */
export async function leaveRoom(roomId: string): Promise<void> {
  await client.post(`/rooms/${roomId}/leave`);
}
