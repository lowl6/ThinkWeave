/**
 * useIdeaPool — 观点池 Hook（所有ThinkLet共享）
 * 封装观点的查询、添加、选中、实时同步
 */
import { useState, useCallback } from 'react';

export interface IdeaItem {
  id: string;
  content: string;
  sourceName: string;
  sourceColor: string;
  sourceType: 'user' | 'ai';
  isSelected: boolean;
  clusterId?: string;
  round?: number;
  parentIdeaId?: string;
}

export function useIdeaPool(stepId: string) {
  const [ideas, setIdeas] = useState<IdeaItem[]>([]);
  const [loading, setLoading] = useState(false);

  // TODO: 接入 TanStack Query 替换手动状态管理
  // TODO: 接入 WebSocket 实时同步

  const addIdea = useCallback((idea: IdeaItem) => {
    setIdeas((prev) => [...prev, idea]);
  }, []);

  const toggleSelect = useCallback((ideaId: string) => {
    setIdeas((prev) =>
      prev.map((i) => (i.id === ideaId ? { ...i, isSelected: !i.isSelected } : i)),
    );
  }, []);

  const batchToggle = useCallback((ideaIds: string[], selected: boolean) => {
    setIdeas((prev) =>
      prev.map((i) => (ideaIds.includes(i.id) ? { ...i, isSelected: selected } : i)),
    );
  }, []);

  const removeIdea = useCallback((ideaId: string) => {
    setIdeas((prev) => prev.filter((i) => i.id !== ideaId));
  }, []);

  const selectedIdeas = ideas.filter((i) => i.isSelected);
  const selectedCount = selectedIdeas.length;

  return {
    ideas,
    setIdeas,
    loading,
    setLoading,
    addIdea,
    toggleSelect,
    batchToggle,
    removeIdea,
    selectedIdeas,
    selectedCount,
  };
}
