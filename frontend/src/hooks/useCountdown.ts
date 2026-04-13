// ============================================================
// ThinkWeave 倒计时Hook
// 用于环节倒计时和房间运行时长
// ============================================================

import { useEffect, useRef, useCallback } from 'react';

interface UseCountdownOptions {
  /** 初始秒数 */
  initialSeconds: number;
  /** 是否自动开始 */
  autoStart?: boolean;
  /** 每秒回调（用于更新store） */
  onTick?: (remaining: number) => void;
  /** 倒计时结束回调 */
  onComplete?: () => void;
  /** 是否是正计时模式（房间运行时长） */
  countUp?: boolean;
}

/**
 * TODO: 实现倒计时/正计时逻辑
 *   - 使用 setInterval 每秒递减/递增
 *   - 支持暂停/恢复/重置
 *   - 倒计时到0时触发 onComplete 回调
 *   - 离开页面时清理interval
 *   - 剩余<60s时标记为urgent状态（用于UI闪烁动画）
 */
export function useCountdown(options: UseCountdownOptions) {
  const { initialSeconds, autoStart = false, onTick, onComplete, countUp = false } = options;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const secondsRef = useRef(initialSeconds);

  const start = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      if (countUp) {
        secondsRef.current += 1;
      } else {
        secondsRef.current -= 1;
      }
      onTick?.(secondsRef.current);
      if (!countUp && secondsRef.current <= 0) {
        stop();
        onComplete?.();
      }
    }, 1000);
  }, [countUp, onTick, onComplete]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback(
    (newSeconds?: number) => {
      stop();
      secondsRef.current = newSeconds ?? initialSeconds;
    },
    [initialSeconds, stop]
  );

  useEffect(() => {
    if (autoStart) start();
    return () => stop();
  }, [autoStart, start, stop]);

  return { start, stop, reset, isUrgent: secondsRef.current < 60 };
}
