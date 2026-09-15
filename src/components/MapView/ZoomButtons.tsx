'use client';

import L from 'leaflet';
import { Minus, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';

const buttonClassName =
  'bg-panel hover:bg-panel-active flex h-9 w-9 items-center justify-center rounded-full shadow transition-colors disabled:cursor-not-allowed disabled:opacity-40';

// 取代 Leaflet 內建方型的 ZoomControl，改用跟 LayerSwitcher 一致的圓形 bg-panel 按鈕風格
export default function ZoomButtons() {
  const map = useMap();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(map.getZoom());

  useEffect(() => {
    if (wrapperRef.current) {
      L.DomEvent.disableClickPropagation(wrapperRef.current);
      L.DomEvent.disableScrollPropagation(wrapperRef.current);
    }
  }, []);

  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  });

  const maxZoom = map.getMaxZoom();
  const minZoom = map.getMinZoom();

  return (
    <div ref={wrapperRef} className="absolute right-3 bottom-3 z-[500] flex flex-col gap-2">
      <button type="button" onClick={() => map.zoomIn()} disabled={zoom >= maxZoom} className={buttonClassName} aria-label="放大">
        <Plus className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => map.zoomOut()} disabled={zoom <= minZoom} className={buttonClassName} aria-label="縮小">
        <Minus className="h-4 w-4" />
      </button>
    </div>
  );
}
