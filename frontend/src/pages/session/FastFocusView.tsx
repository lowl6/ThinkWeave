import { useParams } from 'react-router-dom';
import IdeaCard from '@/components/shared/IdeaCard';
import StepProgressBar from '@/components/shared/StepProgressBar';

/**
 * FastFocus — 快速聚焦投票
 *
 * 功能：
 * - 展示待评审观点列表
 * - keep / merge / discard 三选一投票
 * - 实时投票统计
 * - 应用结果
 */
export default function FastFocusView() {
  const { stepId } = useParams<{ stepId: string }>();

  // TODO: useQuery 获取观点 + 投票状态
  // TODO: useMutation 投票

  const ideas: {
    id: string;
    content: string;
    sourceName: string;
    sourceColor: string;
    votes: { keep: number; merge: number; discard: number };
  }[] = [];

  return (
    <div className="flex flex-col h-full">
      <StepProgressBar stepName="快速聚焦" stepType="FastFocus" />

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {ideas.map((idea) => (
          <div key={idea.id} className="flex items-start gap-4 p-4 rounded-lg bg-surface-light">
            <div className="flex-1">
              <IdeaCard
                content={idea.content}
                sourceName={idea.sourceName}
                sourceColor={idea.sourceColor}
              />
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <button className="px-3 py-1.5 rounded bg-green-600/20 text-green-400 border border-green-600/40 hover:bg-green-600/30 text-sm">
                ✓ 保留 ({idea.votes.keep})
              </button>
              <button className="px-3 py-1.5 rounded bg-yellow-600/20 text-yellow-400 border border-yellow-600/40 hover:bg-yellow-600/30 text-sm">
                ⇄ 合并 ({idea.votes.merge})
              </button>
              <button className="px-3 py-1.5 rounded bg-red-600/20 text-red-400 border border-red-600/40 hover:bg-red-600/30 text-sm">
                ✕ 淘汰 ({idea.votes.discard})
              </button>
            </div>
          </div>
        ))}
        {ideas.length === 0 && (
          <div className="text-center text-gray-500 py-16">暂无待评审观点</div>
        )}
      </div>
    </div>
  );
}
