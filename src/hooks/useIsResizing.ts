import { useEffect, useState } from 'react';

export function useIsResizing(targetRef: React.RefObject<HTMLElement | null>, delay = 200) {
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (!targetRef.current) return;

    let timeout: number;

    const observer = new ResizeObserver(() => {
      setIsResizing(true);

      // 每次 resize 都重新計時
      clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        setIsResizing(false);
      }, delay);
    });

    observer.observe(targetRef.current);

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [targetRef, delay]);

  return isResizing;
}
