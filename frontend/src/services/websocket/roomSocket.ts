// ============================================================
// ThinkWeave 房间实时事件 — Socket.IO
// ============================================================

import { getSocket } from './socketClient';
import type { RoomMember, Message } from '@/types/models';

/**
 * Socket事件类型定义
 */
export interface RoomSocketEvents {
  // ---- 客户端 → 服务器 ----
  'room:join': (roomId: string) => void;
  'room:leave': (roomId: string) => void;
  'message:send': (data: { roomId: string; content: string }) => void;
  'step:next': (roomId: string) => void;
  'step:end': (roomId: string) => void;

  // ---- 服务器 → 客户端 ----
  'room:member-joined': (member: RoomMember) => void;
  'room:member-left': (memberId: string) => void;
  'room:member-online': (memberId: string) => void;
  'room:member-offline': (memberId: string) => void;
  'message:new': (message: Message) => void;
  'message:ai-stream': (data: { agentId: string; token: string }) => void;
  'message:ai-complete': (data: { agentId: string; messageId: string }) => void;
  'step:changed': (data: { stepIndex: number; remainingSeconds: number }) => void;
  'workflow:started': () => void;
  'workflow:ended': () => void;
}

/**
 * 加入房间频道
 *
 * TODO: 订阅房间内所有实时事件
 * TODO: 连接 roomStore.updateMembers / chatStore.appendAIStream 等回调
 */
export function joinRoomChannel(
  roomId: string,
  callbacks: {
    onMemberJoined: (member: RoomMember) => void;
    onMemberLeft: (memberId: string) => void;
    onNewMessage: (message: Message) => void;
    onAIStream: (agentId: string, token: string) => void;
    onAIComplete: (agentId: string) => void;
    onStepChanged: (stepIndex: number, remainingSeconds: number) => void;
  }
): void {
  const socket = getSocket();
  if (!socket) {
    console.error('[RoomSocket] Socket not initialized');
    return;
  }

  // 加入房间
  socket.emit('room:join', roomId);

  // TODO: 注册事件监听器
  socket.on('room:member-joined', callbacks.onMemberJoined);
  socket.on('room:member-left', callbacks.onMemberLeft);
  socket.on('message:new', callbacks.onNewMessage);
  socket.on('message:ai-stream', (data) => {
    callbacks.onAIStream(data.agentId, data.token);
  });
  socket.on('message:ai-complete', (data) => {
    callbacks.onAIComplete(data.agentId);
  });
  socket.on('step:changed', (data) => {
    callbacks.onStepChanged(data.stepIndex, data.remainingSeconds);
  });
}

/**
 * 离开房间频道
 * TODO: 移除所有事件监听器，发送离开事件
 */
export function leaveRoomChannel(roomId: string): void {
  const socket = getSocket();
  if (!socket) return;

  socket.emit('room:leave', roomId);
  socket.off('room:member-joined');
  socket.off('room:member-left');
  socket.off('message:new');
  socket.off('message:ai-stream');
  socket.off('message:ai-complete');
  socket.off('step:changed');
}
