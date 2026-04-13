// ============================================================
// ThinkWeave 房间状态管理 — Zustand Store
// ============================================================

import { create } from 'zustand';
import type { Room, RoomMember, ThinkLetStep } from '@/types/models';

interface RoomState {
  // ---- 当前房间 ----
  currentRoom: Room | null;
  isLoading: boolean;
  error: string | null;

  // ---- Actions ----

  // TODO: 调用 roomApi.createRoom()，创建房间后设置 currentRoom
  createRoom: (topic: string, password?: string) => Promise<void>;

  // TODO: 调用 roomApi.joinRoom()，通过房间号加入，验证密码
  joinRoom: (roomCode: string, password?: string) => Promise<void>;

  // TODO: 调用 roomApi.getRoom()，获取房间详情并设置 currentRoom
  loadRoom: (roomId: string) => Promise<void>;

  // TODO: 更新房间配置（AI专家席位、知识库等），调用 roomApi.updateRoom()
  updateRoomConfig: (config: Partial<Room>) => Promise<void>;

  // TODO: 更新流程步骤列表（添加/删除/修改环节）
  setWorkflow: (steps: ThinkLetStep[]) => void;

  // TODO: 基于WebSocket事件更新成员列表（加入/离开/上线/离线）
  updateMembers: (members: RoomMember[]) => void;

  // TODO: 更新房间运行时长（每秒递增，由useCountdown驱动）
  tickElapsed: () => void;

  // TODO: 重置房间状态（离开房间/开启新研讨时调用）
  resetRoom: () => void;
}

// TODO: 实现所有action函数体，集成roomApi和WebSocket事件
export const useRoomStore = create<RoomState>((set, get) => ({
  currentRoom: null,
  isLoading: false,
  error: null,

  createRoom: async (topic, password) => {
    // TODO: 实现创建房间逻辑
    // 1. set({ isLoading: true })
    // 2. const room = await roomApi.createRoom({ topic, password, agents, workflow })
    // 3. set({ currentRoom: room, isLoading: false })
    // 4. 通过WebSocket加入房间频道
    throw new Error('Not implemented');
  },

  joinRoom: async (roomCode, password) => {
    // TODO: 实现加入房间逻辑
    // 1. 验证房间号格式
    // 2. 调用 roomApi.joinRoom({ roomCode, password })
    // 3. 设置 currentRoom
    // 4. 通过WebSocket加入房间频道
    throw new Error('Not implemented');
  },

  loadRoom: async (roomId) => {
    // TODO: 实现加载房间详情
    throw new Error('Not implemented');
  },

  updateRoomConfig: async (config) => {
    // TODO: 实现更新房间配置
    throw new Error('Not implemented');
  },

  setWorkflow: (steps) => {
    const room = get().currentRoom;
    if (room) {
      set({ currentRoom: { ...room, workflow: steps } });
    }
  },

  updateMembers: (members) => {
    const room = get().currentRoom;
    if (room) {
      set({ currentRoom: { ...room, members } });
    }
  },

  tickElapsed: () => {
    const room = get().currentRoom;
    if (room) {
      set({
        currentRoom: { ...room, elapsedSeconds: room.elapsedSeconds + 1 },
      });
    }
  },

  resetRoom: () => {
    set({ currentRoom: null, isLoading: false, error: null });
  },
}));
