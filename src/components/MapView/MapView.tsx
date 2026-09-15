'use client';

import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';

import { useIsResizing } from '../../hooks/useIsResizing';
import { BASE_MAPS, DEFAULT_BASE_MAP, type BaseMapKey } from './baseMaps';
import LayerSwitcher from './LayerSwitcher';
import ZoomButtons from './ZoomButtons';

type Props = {
  center: [number, number];
  zoom: number;
  // 是否顯示右下角的放大/縮小按鈕
  showZoomControl?: boolean;
  // 是否顯示右上角的圖層切換面板
  showLayerSwitcher?: boolean;
  className?: string;
  children?: ReactNode;
  // 外部容器尺寸有明確切換時（例如全螢幕/縮回）傳入變化的值，
  // 強制重新量測地圖尺寸，不完全依賴 ResizeObserver
  resizeKey?: unknown;
};

// 讓底圖依目前選擇的圖層套用透明度/飽和度，襯托上層的路線描邊或標點
function TileEffect({ opacity, saturate }: { opacity: number; saturate: number }) {
  const map = useMap();

  useEffect(() => {
    const tilePane = map.getPanes().tilePane;
    if (tilePane) {
      tilePane.style.filter = `saturate(${saturate})`;
      tilePane.style.opacity = `${opacity}`;
    }
  }, [map, opacity, saturate]);

  return null;
}

// 容器在 resize 動畫期間（例如側邊欄展開/收合）持續讓地圖重新量測尺寸並保持中心點，避免動畫過程中版面跑掉
function ResizeEffect({ isResizing }: { isResizing: boolean }) {
  const map = useMap();
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isResizing) {
      intervalRef.current = window.setInterval(() => {
        map.invalidateSize();
        map.panTo(L.latLng(map.getCenter().lat, map.getCenter().lng), { animate: false });
      }, 10);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isResizing, map]);

  return null;
}

// ResizeObserver 有時候沒能在 class 切換造成的版面重排（例如全螢幕/縮回）時
// 正確觸發，導致 Leaflet 停留在舊尺寸、地圖看起來是空的。這裡收到外部的切換訊號時
// 強制補一次 invalidateSize，不依賴 ResizeObserver 是否有抓到
function FullscreenToggleEffect({ toggleKey }: { toggleKey: unknown }) {
  const map = useMap();

  useEffect(() => {
    // 切換當下容器可能還在 CSS transition 過程中，量到的是過渡期尺寸；
    // 下一個 frame 再量一次確保拿到最終尺寸
    const raf = requestAnimationFrame(() => map.invalidateSize());
    return () => cancelAnimationFrame(raf);
  }, [toggleKey, map]);

  return null;
}

export default function MapView({ center, zoom, showZoomControl = true, showLayerSwitcher = true, className, children, resizeKey }: Props) {
  const [activeKey, setActiveKey] = useState<BaseMapKey>(DEFAULT_BASE_MAP);
  const [styleOverrides, setStyleOverrides] = useState(
    Object.fromEntries(Object.entries(BASE_MAPS).map(([key, setting]) => [key, { opacity: setting.opacity, saturate: setting.saturate }])) as Record<
      BaseMapKey,
      { opacity: number; saturate: number }
    >
  );

  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const isResizing = useIsResizing(mapWrapperRef, 600);

  const activeSetting = styleOverrides[activeKey];

  return (
    <div ref={mapWrapperRef} className={className ?? 'rounded-panel h-125 w-full overflow-hidden'}>
      <MapContainer center={center} zoom={zoom} scrollWheelZoom className="h-full w-full" zoomControl={false}>
        <TileEffect opacity={activeSetting.opacity} saturate={activeSetting.saturate} />
        <TileLayer url={BASE_MAPS[activeKey].url} />
        {showZoomControl && <ZoomButtons />}
        <ResizeEffect isResizing={isResizing} />
        <FullscreenToggleEffect toggleKey={resizeKey} />

        {showLayerSwitcher && (
          <LayerSwitcher
            activeKey={activeKey}
            onActiveKeyChange={setActiveKey}
            styleOverrides={styleOverrides}
            onStyleOverrideChange={(key, patch) => setStyleOverrides((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }))}
          />
        )}

        {children}
      </MapContainer>
    </div>
  );
}
