import { useParams } from 'react-router-dom';
import IdeaCard from '@/components/shared/IdeaCard';
import StepProgressBar from '@/components/shared/StepProgressBar';

/**
 * PopcornSort — 米花拾掇（选择 + 聚类 + 去重）
 * 对应原型: public/米花拾掇.html
 *
 * 功能：
 * - 卡片网格，点击选中/取消
 * - AI语义聚类
 * - 去重 & 合并相似
 * - 实时活动面板
 */
export default function PopcornSortView() {
  const { stepId } = useParams<{ stepId: string }>();

  // TODO: useQuery 获取观点（含 is_selected, cluster_id）
  // TODO: useMutation 批量选择、聚类、去重

  const ideas: {
    id: string;
    content: string;
    sourceName: string;
    sourceColor: string;
    isSelected: boolean;
    clusterId?: string;
  }[] = [];

  const selectedCount = ideas.filter((i) => i.isSelected).length;

  return (
    <div className="flex flex-col h-full">
      <StepProgressBar stepName="米花拾掇" stepType="PopcornSort" />

      {/* 统计栏 */}
      <div className="px-4 py-2 flex items-center gap-4 text-sm text-gray-400">
        <span>共 {ideas.length} 条观点</span>
        <span className="text-brand-500">已选 {selectedCount}</span>
        <div className="flex-1" />
        <button className="px-3 py-1 rounded bg-purple-600/20 text-purple-400 border border-purple-600/40 hover:bg-purple-600/30 text-xs">
          AI 聚类
        </button>
        <button className="px-3 py-1 rounded bg-red-600/20 text-red-400 border border-red-600/40 hover:bg-red-600/30 text-xs">
          去重
        </button>
      </div>

      {/* 卡片网格 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {ideas.map((idea) => (
            <IdeaCard
              key={idea.id}
              content={idea.content}
              sourceName={idea.sourceName}
              sourceColor={idea.sourceColor}
              selected={idea.isSelected}
              onClick={() => {
                // TODO: toggle selection
              }}
            />
          ))}
          {ideas.length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-16">
              暂无观点
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
