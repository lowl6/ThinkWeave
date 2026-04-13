import type { ReactNode } from 'react';

/**
 * 研讨会话布局 — 左侧成员面板 + 中央内容 + 右侧聊天/观点采纳
 * 对应原型: public/首页.html 的整体布局
 */
interface Props {
  roomId: string;
  children: ReactNode;
}

export default function SessionLayout({ roomId, children }: Props) {
  // TODO: useRoomStore 获取成员列表、agent列表
  // TODO: useChatStore 获取消息列表

  return (
    <div className="h-screen flex bg-surface">
      {/* 左侧 — 成员面板 */}
      <aside className="w-60 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-sm font-semibold text-gray-400">房间 #{roomId}</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {/* TODO: 成员列表 + Agent 列表 */}
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">成员</div>
          <div className="text-sm text-gray-400">暂无成员数据</div>
        </div>
      </aside>

      {/* 中央 — ThinkLet 内容 */}
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>

      {/* 右侧 — 聊天 + 已采纳观点 */}
      <aside className="w-80 border-l border-gray-700 flex flex-col">
        {/* 聊天区 */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-3">对话</div>
          {/* TODO: 消息列表 */}
          <div className="text-sm text-gray-400">暂无消息</div>
        </div>

        {/* 已采纳观点 */}
        <div className="h-48 border-t border-gray-700 overflow-y-auto p-3">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">已采纳观点</div>
          {/* TODO: 已采纳观点列表 */}
          <div className="text-sm text-gray-400">暂无</div>
        </div>

        {/* 聊天输入 */}
        <div className="p-3 border-t border-gray-700">
          <input
            placeholder="发送消息..."
            className="w-full px-3 py-2 rounded-lg bg-surface-light border border-gray-700 focus:border-brand-500 outline-none text-sm"
          />
        </div>
      </aside>
    </div>
  );
}
