// ============================================================
// ThinkWeave 响应式断点Hook
// ============================================================

import { useState, useEffect } from 'react';

/**
 * 监听媒体查询断点
 * 与Tailwind断点对齐：md=768, lg=1024
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/** 是否 >= 768px (md) */
export function useIsMd(): boolean {
  return useMediaQuery('(min-width: 768px)');
}

/** 是否 >= 1024px (lg) */
export function useIsLg(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}
