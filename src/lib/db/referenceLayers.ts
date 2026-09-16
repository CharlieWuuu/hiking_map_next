import 'server-only';

import { sql } from './index';

// 三個官方名單疊在「我的軌跡」之上，讓資料頁一次看完走過的台灣。
// 山頭只有一個座標點（一座山可以有很多條路上去，本來就沒有「路線」），
// 步道則帶簡化幾何，跟著地圖的點→簡化線→詳細線分層走
export type ReferenceMountain = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  completed: boolean;
};

export type ReferenceTrail = {
  id: number;
  name: string;
  lat: number | null;
  lng: number | null;
  path: [number, number][];
  completed: boolean;
};

export type ReferenceLayers = {
  hundred: ReferenceMountain[];
  smallHundred: ReferenceMountain[];
  hundredTrail: ReferenceTrail[];
};

const MOUNTAIN_CATEGORY_NAMES = { hundred: '百岳', smallHundred: '小百岳' } as const;
const TRAIL_CATEGORY_NAME = '百大必訪步道';

// 疊圖只需要看得出形狀，精度可以比逐筆檢視低；小數 5 位約 1 公尺
const GEOJSON_PRECISION = 5;

async function findMountainLayer(categoryName: string, userId: number | null): Promise<ReferenceMountain[]> {
  const rows = await sql`
    SELECT
      m.id,
      m.name,
      ST_Y(m.location::geometry) AS lat,
      ST_X(m.location::geometry) AS lng,
      ${userId}::int IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM hike_mountains hm
          JOIN hikes h ON h.id = hm.hike_id
          WHERE hm.mountain_id = m.id AND h.user_id = ${userId}
        ) AS completed
    FROM mountains m
    JOIN mountain_category_map mcm ON mcm.mountain_id = m.id
    JOIN categories c ON c.id = mcm.category_id
    WHERE c.name = ${categoryName}
  `;

  return rows
    .filter((row) => row.lat !== null && row.lng !== null)
    .map((row) => ({
      id: Number(row.id),
      name: row.name as string,
      lat: Number(row.lat),
      lng: Number(row.lng),
      completed: Boolean(row.completed),
    }));
}

// 後端存的是 MultiLineString，疊圖只取第一條線就夠
function flattenPath(geojson: string | null): [number, number][] {
  if (!geojson) return [];
  const parsed = JSON.parse(geojson) as { type?: string; coordinates?: unknown };
  if (parsed.type === 'LineString') return (parsed.coordinates as [number, number][]) ?? [];
  if (parsed.type === 'MultiLineString') return ((parsed.coordinates as [number, number][][]) ?? [])[0] ?? [];
  return [];
}

async function findTrailLayer(userId: number | null): Promise<ReferenceTrail[]> {
  const rows = await sql`
    SELECT
      t.id,
      t.name,
      ST_Y(tg.center::geometry) AS lat,
      ST_X(tg.center::geometry) AS lng,
      ST_AsGeoJSON(tg.geom_simplified, ${GEOJSON_PRECISION}) AS geojson,
      ${userId}::int IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM hikes h WHERE h.trail_id = t.id AND h.user_id = ${userId}
        ) AS completed
    FROM trails t
    JOIN trail_category_map tcm ON tcm.trail_id = t.id
    JOIN categories c ON c.id = tcm.category_id
    LEFT JOIN trail_geometries tg ON tg.trail_id = t.id
    WHERE c.name = ${TRAIL_CATEGORY_NAME}
  `;

  return rows.map((row) => ({
    id: Number(row.id),
    name: row.name as string,
    lat: row.lat === null || row.lat === undefined ? null : Number(row.lat),
    lng: row.lng === null || row.lng === undefined ? null : Number(row.lng),
    path: flattenPath((row.geojson as string) ?? null),
    completed: Boolean(row.completed),
  }));
}

export async function findReferenceLayers(userId: number | null): Promise<ReferenceLayers> {
  const [hundred, smallHundred, hundredTrail] = await Promise.all([
    findMountainLayer(MOUNTAIN_CATEGORY_NAMES.hundred, userId),
    findMountainLayer(MOUNTAIN_CATEGORY_NAMES.smallHundred, userId),
    findTrailLayer(userId),
  ]);

  return { hundred, smallHundred, hundredTrail };
}
