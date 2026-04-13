import { useState } from 'react';
import { useParams } from 'react-router-dom';
import StepProgressBar from '@/components/shared/StepProgressBar';

/**
 * StrawPoll — 草莓投票（点数分配）
 *
 * 功能：
 * - 展示待投票观点
 * - 分配点数（每人固定预算）
 * - 实时排名
 */
export default function StrawPollView() {
  const { stepId } = useParams<{ stepId: string }>();
  const [allocations, setAllocations] = useState<Record<string, number>>({});

  // TODO: useQuery 获取观点 + 剩余点数 + 排名
  const totalBudget = 10;
  const spent = Object.values(allocations).reduce((s, v) => s + v, 0);
  const remaining = totalBudget - spent;

  const ideas: { id: string; content: string; totalPoints: number }[] = [];

  const handleAllocate = (ideaId: string, delta: number) => {
    setAllocations((prev) => {
      const current = prev[ideaId] || 0;
      const next = Math.max(0, current + delta);
      if (delta > 0 && remaining <= 0) return prev;
      return { ...prev, [ideaId]: next };
    });
  };

  return (
    <div className="flex flex-col h-full">
      <StepProgressBar stepName="草莓投票" stepType="StrawPoll" />

      {/* 预算条 */}
      <div className="px-4 py-3 flex items-center justify-between text-sm">
        <span className="text-gray-400">
          分配点数：{spent} / {totalBudget}
        </span>
        <span className={remaining > 0 ? 'text-green-400' : 'text-red-400'}>
          剩余 {remaining} 点
        </span>
      </div>

      {/* 投票列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {ideas.map((idea) => (
          <div
            key={idea.id}
            className="flex items-center gap-4 p-4 rounded-lg bg-surface-light"
          >
            <div className="flex-1 text-sm">{idea.content}</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAllocate(idea.id, -1)}
                className="w-8 h-8 rounded-full bg-surface border border-gray-600 hover:border-red-400 text-lg"
              >
                −
              </button>
              <span className="w-8 text-center font-bold text-brand-500">
                {allocations[idea.id] || 0}
              </span>
              <button
                onClick={() => handleAllocate(idea.id, 1)}
                disabled={remaining <= 0}
                className="w-8 h-8 rounded-full bg-surface border border-gray-600 hover:border-green-400 disabled:opacity-30 text-lg"
              >
                +
              </button>
            </div>
            <div className="text-xs text-gray-500 w-16 text-right">
              总分 {idea.totalPoints}
            </div>
          </div>
        ))}
        {ideas.length === 0 && (
          <div className="text-center text-gray-500 py-16">暂无待投票观点</div>
        )}
      </div>

      {/* 提交 */}
      <div className="p-4 border-t border-gray-700 flex justify-end">
        <button
          disabled={spent === 0}
          className="px-8 py-3 rounded-lg bg-pink-600 hover:bg-pink-700 disabled:opacity-40 transition font-semibold"
        >
          提交投票
        </button>
      </div>
    </div>
  );
}
