import 'server-only';

import { sql } from './index';

// 對應 NestJS 時期 GET /trails/:slug 的回傳。欄位名直接在 SQL 裡轉成 camelCase，
// 不再需要另一層 adapter 做 snake_case → camelCase 的轉換。
export type TrailDetail = {
  id: number;
  name: string;
  slug: string;
  county: string | null;
  town: string | null;
  description: string | null;
  distanceKm: number | null;
  coverImageUrl: string | null;
  geojson: object | null;
  categoryNames: string[];
};

// decodeURIComponent 遇到單獨的 % 會丟例外（例如 slug 本身就含 %），
// 這種情況下原字串才是正確的值
function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function findTrailBySlug(slug: string): Promise<TrailDetail | null> {
  // slug 含中文，從網址參數拿到時是 percent-encoded（原本經過 axios 會自動解碼）。
  // 在這裡解一次，呼叫端就不必各自處理；已經是解碼狀態的字串再解也不會出錯。
  const decodedSlug = safeDecode(slug);

  // 一次查完，不像原本的 service 分三次往返（trail 本體、幾何、分類）。
  //
  // distance_km 是選填欄位，早期匯入的路線（例如百岳資料夾的 GPX）沒有填，
  // 缺值時用 geom 實際算長度，而不是把 0 顯示給使用者看。
  //
  // 分類用子查詢聚合，避免 JOIN 後一條路線對到多個分類而重複列出。
  const rows = await sql`
    SELECT
      t.id,
      t.name,
      t.slug,
      t.county,
      t.town,
      t.description,
      COALESCE(
        t.distance_km,
        ST_Length(tg.geom::geography) / 1000
      ) AS "distanceKm",
      t.cover_image_url AS "coverImageUrl",
      ST_AsGeoJSON(tg.geom) AS geojson,
      COALESCE(
        (
          SELECT array_agg(c.name ORDER BY c.id)
          FROM trail_category_map tcm
          JOIN categories c ON c.id = tcm.category_id
          WHERE tcm.trail_id = t.id
        ),
        ARRAY[]::text[]
      ) AS "categoryNames"
    FROM trails t
    LEFT JOIN trail_geometries tg ON tg.trail_id = t.id
    WHERE t.slug = ${decodedSlug}
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) return null;

  return {
    ...row,
    // 數值欄位在 pg 可能以字串回傳（numeric 型別），統一轉成 number
    distanceKm: row.distanceKm === null ? null : Number(row.distanceKm),
    // ST_AsGeoJSON 回傳的是 JSON 字串，不是物件
    geojson: row.geojson ? JSON.parse(row.geojson) : null,
  } as TrailDetail;
}
