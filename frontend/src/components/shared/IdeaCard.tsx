/**
 * 观点卡片 — 6种ThinkLet共享的核心UI组件
 * 用于展示用户/AI生成的观点
 */
interface IdeaCardProps {
  content: string;
  sourceName: string;
  sourceColor: string;
  selected?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

export default function IdeaCard({
  content,
  sourceName,
  sourceColor,
  selected = false,
  compact = false,
  onClick,
}: IdeaCardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-lg border transition animate-fade-in ${
        compact ? 'p-2 text-xs' : 'p-3'
      } ${
        selected
          ? 'border-brand-500 bg-brand-600/10 ring-1 ring-brand-500'
          : 'border-gray-700 bg-surface-light hover:border-gray-500'
      } ${onClick ? 'cursor-pointer' : ''}`}
    >
      <p className={compact ? 'line-clamp-2' : 'text-sm mb-2'}>{content}</p>
      <div className="flex items-center gap-1.5 mt-1">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: sourceColor }}
        />
        <span className="text-xs text-gray-500 truncate">{sourceName}</span>
      </div>
    </div>
  );
}
