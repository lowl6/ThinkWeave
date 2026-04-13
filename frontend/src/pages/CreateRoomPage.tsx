import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ThinkLetType } from '@/types/enums';
import { THINKLET_META } from '@/utils/constants';

/**
 * 创建高级房间 — 配置房间信息 + 工作流设计
 * 对应原型: public/创建高级房间.html
 */

interface StepConfig {
  thinklet_type: ThinkLetType;
  title: string;
  duration_minutes: number;
}

export default function CreateRoomPage() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [password, setPassword] = useState('');
  const [steps, setSteps] = useState<StepConfig[]>([]);

  const addStep = (type: ThinkLetType) => {
    const meta = THINKLET_META[type];
    setSteps((prev) => [
      ...prev,
      {
        thinklet_type: type,
        title: meta.nameZh,
        duration_minutes: meta.defaultDuration,
      },
    ]);
  };

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    // TODO: 调用 API 创建房间
    // const res = await roomApi.create({ topic, password, agents: [], workflow: steps });
    // navigate(`/session/${res.room_code}`);
  };

  return (
    <div className="min-h-screen bg-surface p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">创建研讨房间</h1>

        {/* 基础信息 */}
        <section className="mb-8 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">研讨主题</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="例：如何提高远程团队协作效率"
              className="w-full px-4 py-3 rounded-lg bg-surface-light border border-gray-700 focus:border-brand-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">房间密码（可选）</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="留空则不设密码"
              className="w-full px-4 py-3 rounded-lg bg-surface-light border border-gray-700 focus:border-brand-500 outline-none"
            />
          </div>
        </section>

        {/* 工作流设计 */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">研讨流程设计</h2>

          {/* 已添加步骤 */}
          <div className="space-y-3 mb-6">
            {steps.map((step, i) => {
              const meta = THINKLET_META[step.thinklet_type];
              return (
                <div
                  key={i}
                  className={`flex items-center gap-4 p-4 rounded-lg border ${meta.tailwindColor} bg-surface-light`}
                >
                  <span className="text-xl font-bold text-gray-500">{i + 1}</span>
                  <div className="flex-1">
                    <div className="font-semibold">{meta.nameZh}</div>
                    <div className="text-sm text-gray-400">{meta.description}</div>
                  </div>
                  <span className="text-sm text-gray-400">{step.duration_minutes}分钟</span>
                  <button
                    onClick={() => removeStep(i)}
                    className="text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
            {steps.length === 0 && (
              <p className="text-gray-500 text-center py-8">请点击下方ThinkLet添加研讨步骤</p>
            )}
          </div>

          {/* ThinkLet选择器 */}
          <div className="grid grid-cols-3 gap-3">
            {(Object.keys(THINKLET_META) as ThinkLetType[]).map((type) => {
              const meta = THINKLET_META[type];
              return (
                <button
                  key={type}
                  onClick={() => addStep(type)}
                  className="p-3 rounded-lg bg-surface-light border border-gray-700 hover:border-brand-500 transition text-left"
                >
                  <div className="font-medium text-sm">{meta.nameZh}</div>
                  <div className="text-xs text-gray-500 mt-1">{meta.categoryLabel}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 操作按钮 */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-lg border border-gray-600 hover:bg-surface-light transition"
          >
            取消
          </button>
          <button
            onClick={handleCreate}
            disabled={!topic.trim() || steps.length === 0}
            className="flex-1 py-3 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-40 transition font-semibold"
          >
            创建房间
          </button>
        </div>
      </div>
    </div>
  );
}
