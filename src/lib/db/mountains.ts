import 'server-only';

import { sql } from './index';

export type Mountain = {
  id: number;
  name: string;
  elevationM: number;
  location: object;
  range: string | null;
  county: string | null;
  categories: string[];
};

export async function findAllMountains(): Promise<Mountain[]> {
  // 分類用子查詢聚合，避免 JOIN 後一座山對到多個分類而重複列出
  const rows = await sql`
    SELECT
      m.id,
      m.name,
      m.elevation_m AS "elevationM",
      ST_AsGeoJSON(m.location) AS location,
      m.range,
      m.county,
      COALESCE(
        (
          SELECT array_agg(c.name ORDER BY c.id)
          FROM mountain_category_map mcm
          JOIN categories c ON c.id = mcm.category_id
          WHERE mcm.mountain_id = m.id
        ),
        ARRAY[]::text[]
      ) AS categories
    FROM mountains m
    ORDER BY m.name ASC
  `;

  return rows.map((row) => ({
    id: Number(row.id),
    name: row.name as string,
    elevationM: Number(row.elevationM),
    // ST_AsGeoJSON 回傳的是 JSON 字串，不是物件
    location: row.location ? JSON.parse(row.location as string) : {},
    range: (row.range as string) ?? null,
    county: (row.county as string) ?? null,
    categories: (row.categories as string[]) ?? [],
  }));
}

export type MountainInCategory = {
  id: number;
  name: string;
  elevationM: number;
  county: string | null;
  range: string | null;
  /** 這位使用者是否登頂過；未登入時一律 false */
  completed: boolean;
};

const CATEGORY_KEY_TO_NAME: Record<string, string> = {
  hundred: '百岳',
  smallHundred: '小百岳',
};

/**
 * 某個分類的完整山頭名單，附上這位使用者的完成狀態。
 *
 * 跟統計頁的成就數字不同，這裡要的是「名單」——還沒爬的也要列出來，
 * 所以從 mountains 出發用 EXISTS 標記，而不是從 hike_mountains 反查。
 */
export async function findMountainsByCategory(categoryKey: string, userId: number | null): Promise<MountainInCategory[]> {
  const categoryName = CATEGORY_KEY_TO_NAME[categoryKey];
  // 不明的分類回空陣列，而不是當成「不篩選」把所有山都倒出來
  if (!categoryName) return [];

  const rows = await sql`
    SELECT
      m.id,
      m.name,
      m.elevation_m AS "elevationM",
      m.county,
      m.range,
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
    ORDER BY m.elevation_m DESC NULLS LAST, m.name
  `;

  return rows.map((row) => ({
    id: Number(row.id),
    name: row.name as string,
    elevationM: Number(row.elevationM),
    county: (row.county as string) ?? null,
    range: (row.range as string) ?? null,
    completed: Boolean(row.completed),
  }));
}
