import { useState } from 'react';
import { useParams } from 'react-router-dom';
import IdeaCard from '@/components/shared/IdeaCard';
import StepProgressBar from '@/components/shared/StepProgressBar';

/**
 * 自由头脑风暴视图
 * 对应原型: public/自由头脑风暴.html
 *
 * 功能：
 * - 实时观点池（卡片网格）
 * - AI多模型并行生成
 * - 用户输入观点
 * - 倒计时
 */
export default function BrainstormView() {
  const { stepId } = useParams<{ stepId: string }>();
  const [input, setInput] = useState('');

  // TODO: useQuery 获取 step ideas
  // TODO: useMutation 添加观点
  // TODO: useWebSocket 实时同步新观点
  // TODO: useCountdown 倒计时

  const ideas: { id: string; content: string; sourceName: string; sourceColor: string }[] = [];

  const handleSubmit = () => {
    if (!input.trim()) return;
    // TODO: 调用 API 添加观点
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      <StepProgressBar stepName="自由头脑风暴" stepType="FreeBrainstorm" />

      {/* 观点池 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {ideas.map((idea) => (
            <IdeaCard
              key={idea.id}
              content={idea.content}
              sourceName={idea.sourceName}
              sourceColor={idea.sourceColor}
            />
          ))}
          {ideas.length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-16">
              暂无观点，输入你的想法开始头脑风暴！
            </div>
          )}
        </div>
      </div>

      {/* 输入区 */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="输入你的想法..."
            className="flex-1 px-4 py-3 rounded-lg bg-surface-light border border-gray-700 focus:border-brand-500 outline-none"
          />
          <button
            onClick={handleSubmit}
            className="px-6 py-3 rounded-lg bg-brand-600 hover:bg-brand-700 transition font-semibold"
          >
            发送
          </button>
          <button
            className="px-4 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 transition text-sm"
            // TODO: 触发AI生成
          >
            AI生成
          </button>
        </div>
      </div>
    </div>
  );
}
