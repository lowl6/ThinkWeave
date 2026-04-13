import { THINKLET_META } from '@/utils/constants';
import type { ThinkLetType } from '@/types/enums';

/**
 * 环节进度条 — 展示当前ThinkLet名称 + 类型色 + 倒计时
 */
interface StepProgressBarProps {
  stepName: string;
  stepType: ThinkLetType;
  timeRemaining?: number; // 秒
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function StepProgressBar({
  stepName,
  stepType,
  timeRemaining,
}: StepProgressBarProps) {
  const meta = THINKLET_META[stepType];

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700 bg-surface-dark/50">
      <span className="text-xs px-2 py-0.5 rounded-full bg-brand-600/20 text-brand-500">
        {meta?.categoryLabel}
      </span>
      <h2 className="font-semibold">{stepName}</h2>
      <span className="text-xs text-gray-500">{meta?.nameEn}</span>
      <div className="flex-1" />
      {timeRemaining !== undefined && (
        <span
          className={`font-mono text-sm ${
            timeRemaining < 60 ? 'text-red-400 animate-pulse' : 'text-gray-400'
          }`}
        >
          ⏱ {formatTime(timeRemaining)}
        </span>
      )}
    </div>
  );
}
