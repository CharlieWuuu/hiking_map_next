type Position = [number, number];

// 軌跡一律以「多段線」表示：每一段是一串 [經度, 緯度]，段與段之間不相連。
// 一筆紀錄可能由好幾個 GPX 合併而來（中途關掉再開、分早午各錄一段），
// 只取第一段會讓後面的段在地圖上消失；把段接成一條又會畫出不存在的連接線
export function toSegments(geometry: unknown): Position[][] {
  if (!geometry || typeof geometry !== 'object' || !('type' in geometry) || !('coordinates' in geometry)) return [];
  const segments =
    geometry.type === 'LineString' ? [geometry.coordinates as Position[]] : geometry.type === 'MultiLineString' ? (geometry.coordinates as Position[][]) : [];
  return segments.filter((segment) => segment.length > 0);
}

// Leaflet 要的是 [緯度, 經度]，Polyline 直接吃巢狀陣列就會畫成多段線
export function toLatLngSegments(segments: Position[][]): Position[][] {
  return segments.map((segment) => segment.map(([lng, lat]) => [lat, lng]));
}
