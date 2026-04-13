// ============================================================
// ThinkWeave WebSocket连接管理Hook
// ============================================================

import { useEffect } from 'react';
import { initSocket, disconnectSocket } from '@/services';
import { joinRoomChannel, leaveRoomChannel } from '@/services';
import { useRoomStore, useChatStore } from '@/store';

/**
 * TODO: 管理WebSocket生命周期
 *   - 组件挂载时初始化连接
 *   - 加入/离开房间时切换频道
 *   - 连接所有实时事件到对应store
 *   - 组件卸载时断开连接
 */
export function useWebSocket(roomId: string | null) {
  const updateMembers = useRoomStore((s) => s.updateMembers);
  const appendAIStream = useChatStore((s) => s.appendAIStream);
  const finishAIStream = useChatStore((s) => s.finishAIStream);

  useEffect(() => {
    // TODO: 从认证store获取token
    const socket = initSocket();

    if (roomId) {
      joinRoomChannel(roomId, {
        onMemberJoined: (member) => {
          // TODO: 追加新成员到 roomStore
        },
        onMemberLeft: (memberId) => {
          // TODO: 从 roomStore 移除成员
        },
        onNewMessage: (message) => {
          // TODO: 追加消息到 chatStore
        },
        onAIStream: (agentId, token) => {
          appendAIStream(agentId, token);
        },
        onAIComplete: (agentId) => {
          finishAIStream(agentId);
        },
        onStepChanged: (stepIndex, remainingSeconds) => {
          // TODO: 更新 thinkletStore 的当前环节
        },
      });
    }

    return () => {
      if (roomId) {
        leaveRoomChannel(roomId);
      }
    };
  }, [roomId, updateMembers, appendAIStream, finishAIStream]);
}
