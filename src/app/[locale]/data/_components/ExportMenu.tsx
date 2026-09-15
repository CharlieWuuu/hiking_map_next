'use client';

import { Download } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const EXPORT_FORMATS = ['GeoJSON', 'GPX', 'CSV'] as const;

type Props = {
  label: string;
  onExport?: (format: (typeof EXPORT_FORMATS)[number]) => void;
};

// relative 容器 + absolute 選單，位置永遠跟著按鈕走，不用自己算座標
export default function ExportMenu({ label, onExport }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="bg-panel hover:bg-panel-active flex h-7 shrink-0 items-center gap-1 rounded-full px-3 text-xs transition-colors"
      >
        <Download className="h-3.5 w-3.5" />
        {label}
      </button>
      {isOpen && (
        <div className="bg-panel-active rounded-panel absolute top-full right-0 z-20 mt-1 flex w-32 flex-col overflow-hidden text-xs">
          {EXPORT_FORMATS.map((format) => (
            <button
              key={format}
              type="button"
              onClick={() => {
                onExport?.(format);
                setIsOpen(false);
              }}
              className="hover:bg-panel-active-lighten w-full px-3 py-2 text-left transition-colors"
            >
              {format}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
