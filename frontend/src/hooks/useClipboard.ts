// ============================================================
// ThinkWeave 剪贴板操作Hook
// ============================================================

import { useCallback } from 'react';
import { useUIStore } from '@/store';

/**
 * TODO: 封装剪贴板复制操作 + Toast反馈
 *   - 使用 navigator.clipboard.writeText（现代API）
 *   - 回退方案：document.execCommand('copy')
 *   - 复制成功后显示Toast提示
 */
export function useClipboard() {
  const addToast = useUIStore((s) => s.addToast);

  const copy = useCallback(
    async (text: string, successMessage = '已复制到剪贴板') => {
      try {
        await navigator.clipboard.writeText(text);
        addToast(successMessage, 'success');
        return true;
      } catch (err) {
        // 回退方案
        try {
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          addToast(successMessage, 'success');
          return true;
        } catch {
          addToast('复制失败，请手动复制', 'error');
          return false;
        }
      }
    },
    [addToast]
  );

  return { copy };
}
