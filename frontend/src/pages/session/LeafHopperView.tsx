import { useState } from 'react';
import { useParams } from 'react-router-dom';
import IdeaCard from '@/components/shared/IdeaCard';
import StepProgressBar from '@/components/shared/StepProgressBar';

/**
 * LeafHopper — 多轮发散
 *
 * 功能：
 * - 分轮展示观点
 * - 用户基于已有观点发散新想法（parent链）
 * - AI扩展发散
 */
export default function LeafHopperView() {
  const { stepId } = useParams<{ stepId: string }>();
  const [currentRound, setCurrentRound] = useState(1);
  const [input, setInput] = useState('');
  const [selectedParent, setSelectedParent] = useState<string | null>(null);

  // TODO: useQuery 获取当前轮观点
  // TODO: useMutation 提交发散观点

  const ideas: { id: string; content: string; sourceName: string; sourceColor: string; round: number }[] = [];
  const roundIdeas = ideas.filter((i) => i.round === currentRound);

  return (
    <div className="flex flex-col h-full">
      <StepProgressBar stepName="跳跃发散" stepType="LeafHopper" />

      {/* 轮次切换 */}
      <div className="flex gap-2 px-4 pt-3">
        {[1, 2, 3].map((r) => (
          <button
            key={r}
            onClick={() => setCurrentRound(r)}
            className={`px-4 py-1.5 rounded-full text-sm transition ${
              r === currentRound
                ? 'bg-green-600 text-white'
                : 'bg-surface-light text-gray-400 hover:text-white'
            }`}
          >
            轮{r}
          </button>
        ))}
      </div>

      {/* 观点池 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {roundIdeas.map((idea) => (
            <IdeaCard
              key={idea.id}
              content={idea.content}
              sourceName={idea.sourceName}
              sourceColor={idea.sourceColor}
              selected={selectedParent === idea.id}
              onClick={() => setSelectedParent(idea.id === selectedParent ? null : idea.id)}
            />
          ))}
        </div>
      </div>

      {/* 输入区 */}
      <div className="p-4 border-t border-gray-700">
        {selectedParent && (
          <div className="text-sm text-green-400 mb-2">
            基于选中观点发散 →
            <button onClick={() => setSelectedParent(null)} className="ml-2 text-gray-500">
              取消选择
            </button>
          </div>
        )}
        <div className="flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="基于已有想法，发散新观点..."
            className="flex-1 px-4 py-3 rounded-lg bg-surface-light border border-gray-700 focus:border-brand-500 outline-none"
          />
          <button className="px-6 py-3 rounded-lg bg-green-600 hover:bg-green-700 transition font-semibold">
            发散
          </button>
        </div>
      </div>
    </div>
  );
}
