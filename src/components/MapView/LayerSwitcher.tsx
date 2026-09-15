'use client';

import L from 'leaflet';
import { Layers, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { BASE_MAPS, type BaseMapKey } from './baseMaps';

type Props = {
  activeKey: BaseMapKey;
  onActiveKeyChange: (key: BaseMapKey) => void;
  styleOverrides: Record<BaseMapKey, { opacity: number; saturate: number }>;
  onStyleOverrideChange: (key: BaseMapKey, patch: Partial<{ opacity: number; saturate: number }>) => void;
};

export default function LayerSwitcher({ activeKey, onActiveKeyChange, styleOverrides, onStyleOverrideChange }: Props) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // 面板內的點擊/滾動事件不應傳到底下的地圖（否則會觸發拖曳、縮放）
  useEffect(() => {
    if (panelRef.current) {
      L.DomEvent.disableClickPropagation(panelRef.current);
      L.DomEvent.disableScrollPropagation(panelRef.current);
    }
  }, []);

  const activeSetting = styleOverrides[activeKey];

  return (
    <div ref={panelRef} className="absolute bottom-3 left-3 z-[500]">
      <button onClick={() => setOpen(true)} className="bg-panel flex h-9 w-9 items-center justify-center rounded-full shadow" aria-label="切換圖層">
        <Layers className="h-4 w-4" />
      </button>

      {open && (
        <div className="bg-panel rounded-panel absolute bottom-11 left-0 w-64 p-4 shadow-lg">
          <button onClick={() => setOpen(false)} className="absolute top-3 right-3" aria-label="關閉">
            <X className="h-4 w-4" />
          </button>

          <p className="mb-2 text-sm font-bold">背景</p>
          <div className="mb-4 grid grid-cols-3 gap-2">
            {Object.entries(BASE_MAPS).map(([key, setting]) => (
              <label key={key} className="flex flex-col items-center gap-1 text-xs">
                <input
                  type="radio"
                  name="baseMap"
                  className="hidden"
                  value={key}
                  checked={activeKey === key}
                  onChange={() => onActiveKeyChange(key as BaseMapKey)}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={setting.previewSrc}
                  alt={setting.labelZh}
                  className={`h-12 w-12 rounded-md object-cover ${activeKey === key ? 'ring-2 ring-offset-1' : 'opacity-60'}`}
                />
                <span>{setting.labelZh}</span>
              </label>
            ))}
          </div>

          <p className="mb-2 text-sm font-bold">背景樣式</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs">
              <label className="w-12 shrink-0">透明度</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={activeSetting.opacity}
                onChange={(e) => onStyleOverrideChange(activeKey, { opacity: parseFloat(e.target.value) })}
                className="w-full"
              />
              <span className="w-10 shrink-0 text-right">{Math.round(activeSetting.opacity * 100)}%</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <label className="w-12 shrink-0">飽和度</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={activeSetting.saturate}
                onChange={(e) => onStyleOverrideChange(activeKey, { saturate: parseFloat(e.target.value) })}
                className="w-full"
              />
              <span className="w-10 shrink-0 text-right">{Math.round(activeSetting.saturate * 100)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
