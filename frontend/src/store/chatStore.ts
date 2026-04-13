// ============================================================
// ThinkWeave 对话状态管理 — Zustand Store
// ============================================================

import { create } from 'zustand';
import type { Message } from '@/types/models';

interface AdoptedOpinion {
  id: string;
  message: Message;
  adoptedAt: string;
  score?: number;
}

interface ChatState {
  // ---- 消息列表 ----
  messages: Message[];
  isSending: boolean;

  // ---- AI响应中状态（每个响应中的Agent） ----
  streamingAgentIds: string[];

  // ---- 已采纳意见 ----
  adoptedOpinions: AdoptedOpinion[];

  // ---- 历史会话 ----
  conversationHistory: Record<string, { title: string; messages: Message[] }>;
  activeConversationId: string | null;

  // ---- Actions ----

  // TODO: 发送用户消息 → chatApi.sendMessage() → 追加到messages
  //       同时触发AgentDispatcher分发到选中的AI模型
  sendMessage: (content: string, targetAgentIds: string[]) => Promise<void>;

  // TODO: 接收AI流式响应 → 追加/更新对应agent的消息
  //       由AgentStreamHandler驱动，逐token更新content
  appendAIStream: (agentId: string, token: string) => void;

  // TODO: 标记AI流式响应完成，移除streamingAgentIds中的agentId
  finishAIStream: (agentId: string) => void;

  // TODO: 采纳AI消息 → 添加到adoptedOpinions列表，更新消息isAdopted标记
  adoptMessage: (messageId: string) => void;

  // TODO: 对消息打分 → 更新消息score字段，调用chatApi.scoreMessage()
  scoreMessage: (messageId: string, score: number) => void;

  // TODO: 删除已采纳意见
  removeAdopted: (adoptedId: string) => void;

  // TODO: 清空所有已采纳意见
  clearAdopted: () => void;

  // TODO: 导出已采纳意见（生成文本/Markdown格式）
  exportAdopted: () => string;

  // TODO: 加载历史对话 → 替换当前messages
  loadConversation: (conversationId: string) => void;

  // TODO: 重置聊天（开启新研讨）
  resetChat: () => void;

  // TODO: 按AI来源筛选已采纳意见
  filterAdoptedBySource: (source: string | null) => AdoptedOpinion[];
}

// TODO: 实现所有action函数体
export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isSending: false,
  streamingAgentIds: [],
  adoptedOpinions: [],
  conversationHistory: {},
  activeConversationId: null,

  sendMessage: async (content, targetAgentIds) => {
    // TODO: 实现发送消息逻辑
    // 1. 构建user message对象，追加到messages
    // 2. set({ isSending: true })
    // 3. 调用 chatApi.sendMessage()
    // 4. 将 targetAgentIds 加入 streamingAgentIds
    // 5. 通过 AgentDispatcher 并行分发到各Agent
    throw new Error('Not implemented');
  },

  appendAIStream: (agentId, token) => {
    // TODO: 找到streamingAgentIds中对应agent的临时消息，追加token
    // 如果不存在该agent的消息，创建新的AI消息并追加
  },

  finishAIStream: (agentId) => {
    set((state) => ({
      streamingAgentIds: state.streamingAgentIds.filter(
        (id) => id !== agentId
      ),
    }));
  },

  adoptMessage: (messageId) => {
    // TODO: 实现采纳逻辑
  },

  scoreMessage: (messageId, score) => {
    // TODO: 实现打分逻辑，调用API持久化
  },

  removeAdopted: (adoptedId) => {
    set((state) => ({
      adoptedOpinions: state.adoptedOpinions.filter((o) => o.id !== adoptedId),
    }));
  },

  clearAdopted: () => {
    set({ adoptedOpinions: [] });
  },

  exportAdopted: () => {
    // TODO: 将adoptedOpinions格式化为Markdown文本返回
    return '';
  },

  loadConversation: (conversationId) => {
    const conv = get().conversationHistory[conversationId];
    if (conv) {
      set({ messages: conv.messages, activeConversationId: conversationId });
    }
  },

  resetChat: () => {
    set({
      messages: [],
      isSending: false,
      streamingAgentIds: [],
      activeConversationId: null,
    });
  },

  filterAdoptedBySource: (source) => {
    const opinions = get().adoptedOpinions;
    if (!source) return opinions;
    return opinions.filter((o) => o.message.senderName === source);
  },
}));
