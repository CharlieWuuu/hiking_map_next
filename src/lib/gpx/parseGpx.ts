/**
 * 在瀏覽器解析 GPX。
 *
 * GPX 是 XML，用內建的 DOMParser 就夠，不需要額外套件。結構是
 * `<gpx><trk><trkseg><trkpt lat lon><ele><time>`——一個 trk 底下可以有多個
 * trkseg，通常代表中途暫停後再開始，所以一段 trkseg 對應 GeoJSON 的一條線。
 */

export type TrackPoint = {
  /** [經度, 緯度]，順序跟 GeoJSON 一致（不是 Leaflet 的 [lat, lng]） */
  position: [number, number];
  elevation: number | null;
  time: string | null;
};

export type ParsedGpx = {
  name: string | null;
  /** 每個 segment 是一段連續的軌跡 */
  segments: TrackPoint[][];
  /** 第一個有時間的點，用來當紀錄日期（YYYY-MM-DD） */
  date: string | null;
  distanceKm: number;
  /** 有記錄海拔時的總爬升（公尺） */
  elevationGainM: number | null;
  pointCount: number;
};

export class GpxParseError extends Error {}

const EARTH_RADIUS_M = 6371000;

/** 忽略微小的海拔跳動，GPS 的垂直誤差本來就比水平大 */
const ELEVATION_NOISE_M = 3;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** 兩點間的大圓距離（公尺） */
function haversineMeters(a: [number, number], b: [number, number]): number {
  const [lonA, latA] = a;
  const [lonB, latB] = b;

  const dLat = toRadians(latB - latA);
  const dLon = toRadians(lonB - lonA);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);

  const h = sinLat * sinLat + Math.cos(toRadians(latA)) * Math.cos(toRadians(latB)) * sinLon * sinLon;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

function parsePoint(element: Element): TrackPoint | null {
  const lat = Number(element.getAttribute('lat'));
  const lon = Number(element.getAttribute('lon'));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const elevationText = element.getElementsByTagName('ele')[0]?.textContent;
  const elevation = elevationText ? Number(elevationText) : NaN;

  return {
    position: [lon, lat],
    elevation: Number.isFinite(elevation) ? elevation : null,
    time: element.getElementsByTagName('time')[0]?.textContent ?? null,
  };
}

function sumDistanceKm(segments: TrackPoint[][]): number {
  let meters = 0;

  // 只累加同一段之內的距離：段與段之間是暫停，把它們連起來會多算一條直線
  for (const segment of segments) {
    for (let i = 1; i < segment.length; i += 1) {
      meters += haversineMeters(segment[i - 1].position, segment[i].position);
    }
  }

  return meters / 1000;
}

function sumElevationGainM(segments: TrackPoint[][]): number | null {
  let hasElevation = false;
  let gain = 0;

  for (const segment of segments) {
    let reference: number | null = null;

    for (const point of segment) {
      if (point.elevation === null) continue;
      hasElevation = true;

      if (reference === null) {
        reference = point.elevation;
        continue;
      }

      const delta = point.elevation - reference;
      if (delta > ELEVATION_NOISE_M) {
        gain += delta;
        reference = point.elevation;
      } else if (delta < 0) {
        // 下坡就把基準拉低，這樣才不會把下降途中的雜訊算成爬升
        reference = point.elevation;
      }
    }
  }

  return hasElevation ? Math.round(gain) : null;
}

export function parseGpx(xml: string): ParsedGpx {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');

  // DOMParser 不會丟例外，解析失敗時會回傳一份含 parsererror 的文件
  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new GpxParseError('這個檔案不是有效的 XML');
  }
  if (doc.documentElement.tagName !== 'gpx') {
    throw new GpxParseError('這個檔案不是 GPX 格式');
  }

  const segments: TrackPoint[][] = [];
  for (const segmentElement of Array.from(doc.getElementsByTagName('trkseg'))) {
    const points = Array.from(segmentElement.getElementsByTagName('trkpt'))
      .map(parsePoint)
      .filter((point): point is TrackPoint => point !== null);

    // 只有一個點連不成線，PostGIS 也存不了
    if (points.length >= 2) segments.push(points);
  }

  if (segments.length === 0) {
    throw new GpxParseError('這個 GPX 沒有軌跡資料');
  }

  const firstTime = segments.flat().find((point) => point.time !== null)?.time ?? null;

  return {
    name: doc.getElementsByTagName('trk')[0]?.getElementsByTagName('name')[0]?.textContent?.trim() || null,
    segments,
    date: firstTime ? firstTime.slice(0, 10) : null,
    distanceKm: sumDistanceKm(segments),
    elevationGainM: sumElevationGainM(segments),
    pointCount: segments.reduce((total, segment) => total + segment.length, 0),
  };
}

/** 轉成後端 POST /hikes 要的形狀：一個只有單一 feature 的 FeatureCollection */
export function toFeatureCollection(parsed: ParsedGpx) {
  return {
    type: 'FeatureCollection' as const,
    features: [
      {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          // 一律用 MultiLineString，之後合併多筆軌跡才不用換型別
          type: 'MultiLineString' as const,
          coordinates: parsed.segments.map((segment) => segment.map((point) => point.position)),
        },
      },
    ],
  };
}
