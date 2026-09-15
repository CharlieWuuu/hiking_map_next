import 'server-only';

import { sql } from './index';

// 前端用的分類 key -> categories.name
const CATEGORY_KEY_TO_NAME: Record<string, string> = {
  hundred: '百岳',
  smallHundred: '小百岳',
  hundredTrail: '百大必訪步道',
};

const POPULAR_QUERIES_LIMIT = 5;
const POPULAR_QUERIES_WINDOW_DAYS = 30;
const NEARBY_RESULTS_LIMIT = 10;

export type SearchResult = {
  type: 'trail' | 'hike';
  slug: string;
  displayName: string;
  county: string | null;
  town: string | null;
  coverImageUrl: string | null;
  matchReason: 'name' | 'field';
  distanceKm?: number;
  categoryName?: string;
};

// 登入時額外把搜尋範圍擴大到自己的健行紀錄；未登入只搜官方步道。
// 封閉系統下沒有「查別人紀錄」這回事，所以永遠只查 userId 自己的。
export async function search(query: string, userId?: number): Promise<SearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const pattern = `%${q}%`;

  const trailRows = await sql`
    SELECT
      slug,
      name AS "displayName",
      county,
      town,
      cover_image_url AS "coverImageUrl",
      (name ILIKE ${pattern}) AS "matchesName"
    FROM trails
    WHERE name ILIKE ${pattern}
       OR county ILIKE ${pattern}
       OR town ILIKE ${pattern}
       OR description ILIKE ${pattern}
  `;

  const trailResults: SearchResult[] = trailRows.map((row) => ({
    type: 'trail' as const,
    slug: row.slug,
    displayName: row.displayName,
    county: row.county,
    town: row.town,
    coverImageUrl: row.coverImageUrl,
    matchReason: row.matchesName ? ('name' as const) : ('field' as const),
  }));

  let hikeResults: SearchResult[] = [];
  if (userId) {
    const hikeRows = await sql`
      SELECT
        id,
        name AS "displayName",
        county,
        town,
        cover_image_url AS "coverImageUrl",
        (name ILIKE ${pattern}) AS "matchesName"
      FROM hikes
      WHERE user_id = ${userId}
        AND (name ILIKE ${pattern} OR county ILIKE ${pattern} OR town ILIKE ${pattern} OR note ILIKE ${pattern})
    `;

    hikeResults = hikeRows.map((row) => ({
      type: 'hike' as const,
      slug: String(row.id),
      displayName: row.displayName,
      county: row.county,
      town: row.town,
      coverImageUrl: row.coverImageUrl,
      matchReason: row.matchesName ? ('name' as const) : ('field' as const),
    }));
  }

  // 名稱命中的排在前面
  return [...hikeResults, ...trailResults].sort((a, b) => (a.matchReason === b.matchReason ? 0 : a.matchReason === 'name' ? -1 : 1));
}

// 附近路線推薦：一律以 trails + trail_geometries.center 算距離。
// 百岳/小百岳/百大必訪步道都已補齊 trail_category_map，可以一起參與排序。
export async function nearby(lat: number, lng: number): Promise<SearchResult[]> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];

  // 排序與截斷都交給資料庫，不像原本的 service 撈回全部再於 JS 端排序
  const rows = await sql`
    SELECT DISTINCT ON (t.id)
      t.slug,
      t.name AS "displayName",
      t.county,
      t.town,
      t.cover_image_url AS "coverImageUrl",
      c.name AS "categoryName",
      ST_Distance(tg.center::geography, ST_MakePoint(${lng}, ${lat})::geography) / 1000 AS "distanceKm"
    FROM trails t
    JOIN trail_geometries tg ON tg.trail_id = t.id
    JOIN trail_category_map tcm ON tcm.trail_id = t.id
    JOIN categories c ON c.id = tcm.category_id
    WHERE tcm.category_id IN (1, 2, 3)
    ORDER BY t.id, "distanceKm"
  `;

  return rows
    .map((row) => ({
      type: 'trail' as const,
      slug: row.slug,
      displayName: row.displayName,
      county: row.county,
      town: row.town,
      coverImageUrl: row.coverImageUrl,
      matchReason: 'field' as const,
      distanceKm: Number(row.distanceKm),
      categoryName: row.categoryName,
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, NEARBY_RESULTS_LIMIT);
}

// 瀏覽器定位失敗時的備援座標：使用者最新一筆 hike 對應路線的中心點
export async function lastLocation(userId: number): Promise<{ lat: number; lng: number } | null> {
  const rows = await sql`
    SELECT ST_Y(tg.center) AS lat, ST_X(tg.center) AS lng
    FROM hikes h
    JOIN trail_geometries tg ON tg.trail_id = h.trail_id
    WHERE h.user_id = ${userId}
    ORDER BY h.date DESC, h.id DESC
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) return null;
  return { lat: Number(row.lat), lng: Number(row.lng) };
}

export async function filterTrails(categoryKey: string | null, county: string | null): Promise<SearchResult[]> {
  // 未知的分類 key 直接回空陣列，避免當成「不篩選」而回傳全部
  const categoryName = categoryKey ? CATEGORY_KEY_TO_NAME[categoryKey] : null;
  if (categoryKey && !categoryName) return [];

  // 兩個條件都是選填，用 (參數 IS NULL OR 條件) 讓 SQL 保持單一形狀，
  // 不必像原本那樣手動拼接 WHERE 與參數索引
  const rows = await sql`
    SELECT
      t.slug,
      t.name AS "displayName",
      t.county,
      t.town,
      t.cover_image_url AS "coverImageUrl"
    FROM trails t
    WHERE (${county}::text IS NULL OR t.county = ${county})
      AND (
        ${categoryName}::text IS NULL
        OR t.id IN (
          SELECT tcm.trail_id
          FROM trail_category_map tcm
          JOIN categories c ON c.id = tcm.category_id
          WHERE c.name = ${categoryName}
        )
      )
    ORDER BY t.name
  `;

  return rows.map((row) => ({
    type: 'trail' as const,
    slug: row.slug,
    displayName: row.displayName,
    county: row.county,
    town: row.town,
    coverImageUrl: row.coverImageUrl,
    matchReason: 'field' as const,
  }));
}

export async function popularQueries(): Promise<string[]> {
  const rows = await sql`
    SELECT query
    FROM search_queries
    WHERE created_at > now() - make_interval(days => ${POPULAR_QUERIES_WINDOW_DAYS})
    GROUP BY query
    ORDER BY COUNT(*) DESC, MAX(created_at) DESC
    LIMIT ${POPULAR_QUERIES_LIMIT}
  `;
  return rows.map((row) => row.query as string);
}

export async function logQuery(query: string): Promise<void> {
  const q = query.trim();
  if (!q) return;
  await sql`INSERT INTO search_queries (query) VALUES (${q})`;
}
