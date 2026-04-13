// ============================================================
// ThinkWeave Agent状态管理 — Zustand Store
// ============================================================

import { create } from 'zustand';
import type { AgentModel, AgentConfig } from '@/types/models';
import { BUILT_IN_AGENTS } from '@/utils/constants';

interface AgentState {
  // ---- 可用模型列表 ----
  availableModels: AgentModel[];

  // ---- 当前房间的Agent配置 ----
  agentConfigs: Map<string, AgentConfig>;

  // ---- 当前用户选中的活跃Agent（参与响应的） ----
  activeAgentIds: string[];

  // ---- Actions ----

  // TODO: 初始化内置模型列表（从constants加载 + 从后端获取可用列表）
  initModels: () => void;

  // TODO: 注册新的Agent模型（支持未来动态添加第三方模型）
  registerModel: (model: AgentModel) => void;

  // TODO: 设置某个Agent的完整配置（模型/角色模板/参数/知识库）
  //       从AgentConfigModal保存时调用
  setAgentConfig: (agentId: string, config: AgentConfig) => void;

  // TODO: 切换Agent激活状态（复选框选中/取消）
  toggleAgent: (agentId: string) => void;

  // TODO: 添加AI成员到当前房间
  addAgentToRoom: (agentId: string) => void;

  // TODO: 获取指定Agent的完整配置（合并默认值）
  getAgentConfig: (agentId: string) => AgentConfig | undefined;

  // TODO: 获取所有活跃Agent的配置列表（用于AgentDispatcher分发）
  getActiveConfigs: () => AgentConfig[];

  // TODO: 重置所有Agent状态
  resetAgents: () => void;
}

// TODO: 实现所有action函数体
export const useAgentStore = create<AgentState>((set, get) => ({
  availableModels: BUILT_IN_AGENTS,
  agentConfigs: new Map(),
  activeAgentIds: ['deepseek-v3', 'wenxin'], // 默认激活DeepSeek和文心

  initModels: () => {
    // TODO: 合并内置模型 + 后端返回的模型列表
    set({ availableModels: BUILT_IN_AGENTS });
  },

  registerModel: (model) => {
    set((state) => ({
      availableModels: [...state.availableModels, model],
    }));
  },

  setAgentConfig: (agentId, config) => {
    set((state) => {
      const newConfigs = new Map(state.agentConfigs);
      newConfigs.set(agentId, config);
      return { agentConfigs: newConfigs };
    });
  },

  toggleAgent: (agentId) => {
    set((state) => {
      const isActive = state.activeAgentIds.includes(agentId);
      return {
        activeAgentIds: isActive
          ? state.activeAgentIds.filter((id) => id !== agentId)
          : [...state.activeAgentIds, agentId],
      };
    });
  },

  addAgentToRoom: (agentId) => {
    // TODO: 添加Agent到房间，初始化默认配置，更新roomStore
  },

  getAgentConfig: (agentId) => {
    return get().agentConfigs.get(agentId);
  },

  getActiveConfigs: () => {
    const { activeAgentIds, agentConfigs } = get();
    return activeAgentIds
      .map((id) => agentConfigs.get(id))
      .filter(Boolean) as AgentConfig[];
  },

  resetAgents: () => {
    set({
      agentConfigs: new Map(),
      activeAgentIds: ['deepseek-v3', 'wenxin'],
    });
  },
}));
