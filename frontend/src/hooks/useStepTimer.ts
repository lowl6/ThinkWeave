/**
 * useStepTimer — 环节倒计时 Hook
 * 通过 WebSocket 同步倒计时
 */
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseStepTimerOptions {
  initialSeconds: number;
  onTimeUp?: () => void;
  autoStart?: boolean;
}

export function useStepTimer({ initialSeconds, onTimeUp, autoStart = false }: UseStepTimerOptions) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [running, setRunning] = useState(autoStart);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!running) return;

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [running, onTimeUp]);

  const start = useCallback(() => setRunning(true), []);
  const pause = useCallback(() => setRunning(false), []);
  const reset = useCallback((sec?: number) => {
    setRemaining(sec ?? initialSeconds);
    setRunning(false);
  }, [initialSeconds]);

  return { remaining, running, start, pause, reset };
}
