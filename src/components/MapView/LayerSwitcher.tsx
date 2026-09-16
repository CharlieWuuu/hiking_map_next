'use client';

import L from 'leaflet';
import { Layers, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { BASE_MAPS, type BaseMapKey } from './baseMaps';

// 官方名單疊圖的開關。底圖與疊圖都是「這張地圖上要顯示什麼」，
// 放在同一個面板裡，不另外開一顆按鈕佔地圖角落
export type OverlayKey = 'hundred' | 'smallHundred' | 'hundredTrail';

export type OverlayControl = {
  visible: Record<OverlayKey, boolean>;
  counts: Record<OverlayKey, { completed: number; total: number }> | null;
  isLoading: boolean;
  onToggle: (key: OverlayKey) => void;
  labels: Record<OverlayKey, string>;
  loadingLabel: string;
  title: string;
};

// 跟地圖上的疊圖同色系，讓面板裡的色塊對得起地圖上的點
const OVERLAY_COLOR: Record<OverlayKey, string> = {
  hundred: '#7FD4FF',
  smallHundred: '#4A9FD4',
  hundredTrail: '#B08CFF',
};

const OVERLAY_KEYS: OverlayKey[] = ['hundred', 'smallHundred', 'hundredTrail'];

type Props = {
  activeKey: BaseMapKey;
  onActiveKeyChange: (key: BaseMapKey) => void;
  styleOverrides: Record<BaseMapKey, { opacity: number; saturate: number }>;
  onStyleOverrideChange: (key: BaseMapKey, patch: Partial<{ opacity: number; saturate: number }>) => void;
  // 沒給就只顯示底圖設定（例如編輯頁的單一路線預覽不需要疊圖）
  overlays?: OverlayControl;
};

export default function LayerSwitcher({ activeKey, onActiveKeyChange, styleOverrides, onStyleOverrideChange, overlays }: Props) {
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

          {overlays && (
            <>
              <p className="mb-2 text-sm font-bold">{overlays.title}</p>
              <div className="mb-4 flex flex-col gap-1">
                {OVERLAY_KEYS.map((key) => {
                  const count = overlays.counts?.[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => overlays.onToggle(key)}
                      className={`hover:bg-panel-active flex items-center gap-2 rounded px-2 py-1 text-left text-xs transition-colors ${
                        overlays.visible[key] ? 'text-background-contrary' : 'text-background-contrary/40'
                      }`}
                    >
                      <span
                        aria-hidden
                        className="h-3 w-3 shrink-0 rounded-sm border"
                        style={{ borderColor: OVERLAY_COLOR[key], backgroundColor: overlays.visible[key] ? OVERLAY_COLOR[key] : 'transparent' }}
                      />
                      <span className="whitespace-nowrap">{overlays.labels[key]}</span>
                      <span className="text-background-contrary/50 ml-auto whitespace-nowrap tabular-nums">
                        {overlays.isLoading ? overlays.loadingLabel : count ? `${count.completed}/${count.total}` : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

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
