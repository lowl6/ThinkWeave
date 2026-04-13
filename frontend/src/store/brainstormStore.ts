// ============================================================
// ThinkWeave 头脑风暴状态管理 — Zustand Store
// ============================================================

import { create } from 'zustand';
import type { Idea, Cluster } from '@/types/models';

interface BrainstormState {
  // ---- 灵感池 ----
  ideas: Idea[];

  // ---- 聚类结果 ----
  clusters: Cluster[];
  isClusterLoading: boolean;

  // ---- 筛选状态（米花拾掇） ----
  selectedIdeaIds: Set<string>;
  filterCompleteCount: number; // 已完成筛选的成员数
  totalMemberCount: number;

  // ---- Actions ----

  // TODO: 从AI响应中自动提取观点并添加到灵感池
  //       调用 Agent IdeaExtractionPlugin 解析AI消息内容
  addIdeasFromAI: (agentId: string, messageContent: string) => void;

  // TODO: 手动添加灵感便签
  addManualIdea: (content: string) => void;

  // TODO: 编辑指定灵感卡片内容
  editIdea: (ideaId: string, newContent: string) => void;

  // TODO: 删除指定灵感卡片
  removeIdea: (ideaId: string) => void;

  // TODO: 切换观点选中状态（米花拾掇点击卡片）
  toggleIdeaSelection: (ideaId: string) => void;

  // TODO: AI语义聚类 → 调用 agentApi 的语义聚类接口
  //       返回clusters数组，更新每个idea的clusterId
  triggerSemanticCluster: () => Promise<void>;

  // TODO: 移除重复观点 → 调用 agentApi 检测重复项 → 标记/删除
  removeDuplicates: () => Promise<void>;

  // TODO: 一键合并相似观点 → 将同cluster内的观点合并为一条
  mergeCluster: (clusterId: string) => void;

  // TODO: 获取已选中的观点数量
  getSelectedCount: () => number;

  // TODO: 结束筛选 → 保留选中的观点，清除未选中的
  finishSelection: () => void;

  // TODO: 重置头脑风暴状态
  resetBrainstorm: () => void;
}

// TODO: 实现所有action函数体
export const useBrainstormStore = create<BrainstormState>((set, get) => ({
  ideas: [],
  clusters: [],
  isClusterLoading: false,
  selectedIdeaIds: new Set(),
  filterCompleteCount: 0,
  totalMemberCount: 5,

  addIdeasFromAI: (agentId, messageContent) => {
    // TODO: 调用 IdeaExtractionPlugin.extract(messageContent)
    // 解析出多条观点，每条创建 Idea 对象，设置source和sourceColor
  },

  addManualIdea: (content) => {
    const newIdea: Idea = {
      id: crypto.randomUUID(),
      content,
      source: '手动添加',
      sourceColor: '#6b7280',
      createdAt: new Date().toISOString(),
      isSelected: false,
    };
    set((state) => ({ ideas: [...state.ideas, newIdea] }));
  },

  editIdea: (ideaId, newContent) => {
    set((state) => ({
      ideas: state.ideas.map((idea) =>
        idea.id === ideaId ? { ...idea, content: newContent } : idea
      ),
    }));
  },

  removeIdea: (ideaId) => {
    set((state) => ({
      ideas: state.ideas.filter((idea) => idea.id !== ideaId),
    }));
  },

  toggleIdeaSelection: (ideaId) => {
    set((state) => {
      const newSelected = new Set(state.selectedIdeaIds);
      if (newSelected.has(ideaId)) {
        newSelected.delete(ideaId);
      } else {
        newSelected.add(ideaId);
      }
      return { selectedIdeaIds: newSelected };
    });
  },

  triggerSemanticCluster: async () => {
    // TODO: 实现AI语义聚类
    // 1. set({ isClusterLoading: true })
    // 2. 调用 agentApi.semanticCluster(ideaIds)
    // 3. 解析返回的 clusters
    // 4. 更新 ideas 的 clusterId
    // 5. set({ clusters, isClusterLoading: false })
    throw new Error('Not implemented');
  },

  removeDuplicates: async () => {
    // TODO: 调用AI检测重复项并移除
    throw new Error('Not implemented');
  },

  mergeCluster: (clusterId) => {
    // TODO: 合并同一cluster内的观点为一条综合观点
  },

  getSelectedCount: () => {
    return get().selectedIdeaIds.size;
  },

  finishSelection: () => {
    const { selectedIdeaIds, ideas } = get();
    set({
      ideas: ideas.filter((idea) => selectedIdeaIds.has(idea.id)),
      selectedIdeaIds: new Set(),
    });
  },

  resetBrainstorm: () => {
    set({
      ideas: [],
      clusters: [],
      isClusterLoading: false,
      selectedIdeaIds: new Set(),
      filterCompleteCount: 0,
    });
  },
}));
