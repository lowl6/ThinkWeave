// ============================================================
// ThinkWeave Toast通知Hook
// ============================================================

import { useEffect } from 'react';
import { useUIStore } from '@/store';

/**
 * TODO: 管理Toast自动消失逻辑
 *   - 每条Toast显示2秒后自动移除
 *   - 支持手动关闭
 */
export function useToast() {
  const toasts = useUIStore((s) => s.toasts);
  const removeToast = useUIStore((s) => s.removeToast);
  const addToast = useUIStore((s) => s.addToast);

  useEffect(() => {
    if (toasts.length === 0) return;

    const latest = toasts[toasts.length - 1];
    const timer = setTimeout(() => {
      removeToast(latest.id);
    }, 2000);

    return () => clearTimeout(timer);
  }, [toasts, removeToast]);

  return { toasts, addToast, removeToast };
}
