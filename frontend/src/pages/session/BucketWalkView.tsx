import { useState } from 'react';
import { useParams } from 'react-router-dom';
import IdeaCard from '@/components/shared/IdeaCard';
import StepProgressBar from '@/components/shared/StepProgressBar';

/**
 * BucketWalk — 分桶归类
 *
 * 功能：
 * - 创建分类桶（颜色标签）
 * - 拖拽 / 点击将观点分配到桶
 * - AI自动归类建议
 */
export default function BucketWalkView() {
  const { stepId } = useParams<{ stepId: string }>();
  const [newBucketLabel, setNewBucketLabel] = useState('');

  // TODO: useQuery 获取桶 + 观点
  // TODO: useMutation 创建桶、分配观点、AI自动归类

  const buckets: { id: string; label: string; color: string; ideas: { id: string; content: string }[] }[] = [];
  const unassigned: { id: string; content: string; sourceName: string; sourceColor: string }[] = [];

  return (
    <div className="flex flex-col h-full">
      <StepProgressBar stepName="分桶归类" stepType="BucketWalk" />

      <div className="flex-1 overflow-y-auto p-4">
        {/* 未分配的观点 */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">
            待分配 ({unassigned.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {unassigned.map((idea) => (
              <IdeaCard
                key={idea.id}
                content={idea.content}
                sourceName={idea.sourceName}
                sourceColor={idea.sourceColor}
                compact
              />
            ))}
          </div>
        </div>

        {/* 分类桶 */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {buckets.map((bucket) => (
            <div
              key={bucket.id}
              className="rounded-xl border-2 border-dashed p-4 min-h-[160px]"
              style={{ borderColor: bucket.color }}
            >
              <div className="font-semibold mb-3" style={{ color: bucket.color }}>
                {bucket.label} ({bucket.ideas.length})
              </div>
              <div className="space-y-2">
                {bucket.ideas.map((idea) => (
                  <div key={idea.id} className="text-sm p-2 rounded bg-surface-light">
                    {idea.content}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* 添加桶 */}
          <div className="rounded-xl border-2 border-dashed border-gray-600 p-4 flex flex-col items-center justify-center gap-3">
            <input
              value={newBucketLabel}
              onChange={(e) => setNewBucketLabel(e.target.value)}
              placeholder="桶名称"
              className="w-full px-3 py-2 rounded bg-surface-light border border-gray-700 outline-none text-sm text-center"
            />
            <button className="text-sm text-brand-500 hover:text-brand-400">+ 添加桶</button>
          </div>
        </div>
      </div>

      {/* AI自动归类按钮 */}
      <div className="p-4 border-t border-gray-700 flex justify-end">
        <button className="px-6 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 transition text-sm font-semibold">
          AI 自动归类
        </button>
      </div>
    </div>
  );
}
