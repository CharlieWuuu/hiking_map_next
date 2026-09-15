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
