'use client';

import L from 'leaflet';
import { useEffect } from 'react';
import { Polyline, useMap } from 'react-leaflet';

import MapView from '../MapView';

type Props = {
  // 路線座標序列，[經度, 緯度]
  path: [number, number][];
  // bbox，[minLng, minLat, maxLng, maxLat]；有的話優先用這個算出剛好框住整條路線的縮放範圍
  bbox?: [number, number, number, number] | null;
  // 幾何中心（bbox centroid），[經度, 緯度]；bbox 缺漏時的 fallback，沒有的話再 fallback 成路徑中點
  center?: [number, number] | null;
  className?: string;
};

// 有 bbox 時，地圖初始化後改用 fitBounds 讓整條路線剛好置中且完整落在視野內，
// 不必像固定 center+zoom 那樣用猜的縮放層級
function FitBoundsEffect({ bbox }: { bbox: NonNullable<Props['bbox']> }) {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLngBounds([bbox[1], bbox[0]], [bbox[3], bbox[2]]);
    if (!bounds.isValid()) return;
    map.fitBounds(bounds, { padding: [40, 40] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, bbox[0], bbox[1], bbox[2], bbox[3]]);

  return null;
}

export default function TrailLayer({ path, bbox, center: centerLngLat, className }: Props) {
  const latLngPath: [number, number][] = path.map(([lng, lat]) => [lat, lng]);
  const center: [number, number] | undefined = centerLngLat ? [centerLngLat[1], centerLngLat[0]] : latLngPath[Math.floor(latLngPath.length / 2)];

  return (
    <MapView center={center} zoom={15} className={className}>
      {bbox && <FitBoundsEffect bbox={bbox} />}
      <Polyline positions={latLngPath} pathOptions={{ color: '#000000', weight: 8 }} interactive={false} />
      <Polyline positions={latLngPath} pathOptions={{ color: '#FFFF3C', weight: 4 }} interactive={false} />
    </MapView>
  );
}
