'use client';

import { useEffect } from 'react';
import { CircleMarker, Tooltip, useMap } from 'react-leaflet';

import MapView from '../../../../../../components/MapView';

export type MappedItem = {
  id: number | string;
  name: string;
  lat: number;
  lng: number;
  completed?: boolean;
  // 副標：山頭顯示海拔、步道顯示距離，跟清單右側那欄同一個值
  meta?: string;
};

// 台灣本島中心與縮放，讓 100 座山頭一次入鏡
const TAIWAN_CENTER: [number, number] = [23.7, 120.9];
const TAIWAN_ZOOM = 7;

// 選中的項目飛過去。放在 MapContainer 內才拿得到 useMap
function FlyToSelected({ items, selectedId }: { items: MappedItem[]; selectedId: string | number | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedId === null) return;
    const target = items.find((item) => item.id === selectedId);
    if (!target) return;
    // 停在 12 級：看得到山頭周邊地形，又不會近到失去方位感
    map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 12), { duration: 0.6 });
  }, [selectedId, items, map]);

  return null;
}

type Props = {
  items: MappedItem[];
  selectedId: string | number | null;
  onSelect: (id: string | number) => void;
};

export default function MountainMap({ items, selectedId, onSelect }: Props) {
  return (
    <MapView center={TAIWAN_CENTER} zoom={TAIWAN_ZOOM} className="rounded-panel h-full w-full overflow-hidden">
      <FlyToSelected items={items} selectedId={selectedId} />
      {items.map((item) => {
        const isSelected = item.id === selectedId;
        return (
          <CircleMarker
            key={item.id}
            center={[item.lat, item.lng]}
            // 沿用資料頁地圖的配色：未完成是深金褐 #A67C00、已完成換成亮黃
            // #FFFF3C（資料頁用來標示選取路線的顏色），選中的再放大並改黑框。
            // 完成與否用色相區分就夠，不靠不透明度——半透明會讓底圖透出來，
            // 點與點重疊時顏色混在一起反而更難讀
            radius={isSelected ? 9 : 6}
            pathOptions={{
              color: isSelected ? '#000000' : '#ffffff',
              weight: 2,
              fillColor: item.completed ? '#FFFF3C' : '#A67C00',
              fillOpacity: 1,
            }}
            eventHandlers={{ click: () => onSelect(item.id) }}
          >
            {/* 沿用資料頁懸浮卡的樣式：Leaflet 預設泡泡的白底／邊框／箭頭由
                .hiking-map-tooltip 拔掉，內層自己畫一張 bg-panel 卡片 */}
            <Tooltip direction="top" offset={[0, -8]} className="hiking-map-tooltip">
              <div className="bg-panel text-background-contrary rounded-panel flex flex-col gap-1 p-3">
                <span className="text-base font-bold">{item.name}</span>
                {item.meta && <span className="text-background-contrary/60 text-xs">{item.meta}</span>}
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapView>
  );
}
