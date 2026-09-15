import 'server-only';

import { sql } from './index';
import { deleteByUrl, uploadImmutableJson } from './storage';

// 簡化線的容差（度）。約 50 公尺，遠景畫線用這條就夠，
// 完整軌跡另外存在 R2，放大時才抓
const SIMPLIFY_TOLERANCE_DEG = 0.00045;

export type CreateHikeInput = {
  name: string;
  date: string;
  county?: string | null;
  town?: string | null;
  trailId?: number | null;
  isPublic?: boolean;
  note?: string | null;
  urls?: string[];
  coverImageUrl?: string | null;
  mountainIds?: number[];
  // GeoJSON 的 geometry（LineString 或 MultiLineString）
  geometry: object;
};

export type UpdateHikeInput = {
  name?: string;
  date?: string;
  county?: string | null;
  town?: string | null;
  isPublic?: boolean;
  note?: string | null;
  urls?: string[];
  mountainIds?: number[];
};

export type WriteResult<T> = { ok: true; value: T } | { ok: false; reason: 'not-found' | 'forbidden' | 'invalid-geometry' };

// 一筆紀錄只有本人能改。查不到與不是本人分開回報：
// 前者是網址打錯，後者是權限問題，前端的訊息不一樣
async function assertOwned(hikeId: number, userId: number): Promise<'ok' | 'not-found' | 'forbidden'> {
  const rows = await sql`SELECT user_id AS "userId" FROM hikes WHERE id = ${hikeId} LIMIT 1`;
  if (rows.length === 0) return 'not-found';
  return Number(rows[0].userId) === userId ? 'ok' : 'forbidden';
}

// 把完整軌跡另存一份到 R2，供前端在放大或匯出時直接抓。
// 失敗不該讓整個流程失敗——紀錄本身已經寫好了，前端會退回使用簡化線。
async function storeFullTrack(hikeId: number, geometry: object): Promise<void> {
  try {
    // 編輯過的紀錄會有一份舊的，換上新網址之後那份就沒人讀得到了
    const previous = await sql`SELECT track_url AS "trackUrl" FROM hike_tracks WHERE hike_id = ${hikeId}`;

    const url = await uploadImmutableJson(geometry, 'tracks');
    await sql`UPDATE hike_tracks SET track_url = ${url} WHERE hike_id = ${hikeId}`;

    // 新網址寫進資料庫之後才刪舊的，中途失敗也不會留下指向已刪檔案的紀錄
    await deleteByUrl((previous[0]?.trackUrl as string) ?? null);
  } catch (error) {
    console.warn(`hike ${hikeId} 的完整軌跡沒能存進 R2，前端會退回使用簡化線：${String(error)}`);
  }
}

export async function createHike(userId: number, input: CreateHikeInput): Promise<WriteResult<{ id: number }>> {
  const geometryJson = JSON.stringify(input.geometry);

  // 整筆新增寫成單一 CTE：主表的 RETURNING id 直接餵給軌跡與山頭關聯，
  // 一句 SQL 天然具原子性，不需要交易（Neon 的 HTTP driver 也無法在交易中途
  // 讀結果再決定下一步）。
  //
  // 距離一律由 PostGIS 從軌跡算，不採用前端送來的值——否則新建與編輯會是
  // 兩套定義，統計等於在加總兩種不同的數字。
  let rows;
  try {
    rows = await sql`
      WITH source AS (
        SELECT ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON(${geometryJson}), 4326)) AS g
      ),
      new_hike AS (
        INSERT INTO hikes (user_id, trail_id, name, county, town, date, distance_km, is_public, note, urls, cover_image_url)
        SELECT
          ${userId},
          ${input.trailId ?? null},
          ${input.name},
          ${input.county ?? null},
          ${input.town ?? null},
          ${input.date}::date,
          COALESCE(ST_Length(g::geography) / 1000, 0),
          ${input.isPublic ?? true},
          ${input.note ?? null},
          ${input.urls ?? []}::text[],
          ${input.coverImageUrl ?? null}
        FROM source
        RETURNING id
      ),
      new_track AS (
        INSERT INTO hike_tracks (hike_id, geom, geom_simplified, point_count)
        SELECT
          new_hike.id,
          source.g,
          ST_Multi(ST_SimplifyPreserveTopology(source.g, ${SIMPLIFY_TOLERANCE_DEG})),
          ST_NPoints(source.g)
        FROM new_hike, source
        RETURNING hike_id
      ),
      new_mountains AS (
        INSERT INTO hike_mountains (hike_id, mountain_id)
        SELECT new_hike.id, m
        FROM new_hike, unnest(${input.mountainIds ?? []}::int[]) AS m
        RETURNING hike_id
      )
      SELECT id FROM new_hike
    `;
  } catch (error) {
    // ST_GeomFromGeoJSON 對無效的幾何會拋錯，那是輸入格式問題而非系統錯誤
    if (error instanceof Error && /GeoJSON|geometry|SRID/i.test(error.message)) {
      return { ok: false, reason: 'invalid-geometry' };
    }
    throw error;
  }

  const hikeId = Number(rows[0].id);

  // R2 是網路呼叫，放在資料寫入之後才做，失敗也只是少了「高縮放才用得到」的那一層
  await storeFullTrack(hikeId, input.geometry);

  return { ok: true, value: { id: hikeId } };
}

export async function updateHike(hikeId: number, userId: number, input: UpdateHikeInput): Promise<WriteResult<{ id: number }>> {
  const owned = await assertOwned(hikeId, userId);
  if (owned !== 'ok') return { ok: false, reason: owned };

  // 只更新有帶到的欄位。COALESCE 讓沒帶的保持原值，
  // 不必為了「只改其中一個」而動態拼接 SQL。
  // county / town / note 允許被設成 null，所以額外用一個布林參數區分
  // 「沒帶這個欄位」與「帶了 null」
  await sql`
    UPDATE hikes SET
      name = COALESCE(${input.name ?? null}, name),
      date = COALESCE(${input.date ?? null}::date, date),
      county = CASE WHEN ${input.county !== undefined} THEN ${input.county ?? null} ELSE county END,
      town = CASE WHEN ${input.town !== undefined} THEN ${input.town ?? null} ELSE town END,
      note = CASE WHEN ${input.note !== undefined} THEN ${input.note ?? null} ELSE note END,
      is_public = COALESCE(${input.isPublic ?? null}, is_public),
      urls = CASE WHEN ${input.urls !== undefined} THEN ${input.urls ?? []}::text[] ELSE urls END
    WHERE id = ${hikeId}
  `;

  // mountain_ids 是整批取代（不像分類那樣逐個開關），前端每次都送完整清單
  if (input.mountainIds !== undefined) {
    await sql`DELETE FROM hike_mountains WHERE hike_id = ${hikeId}`;
    if (input.mountainIds.length > 0) {
      await sql`
        INSERT INTO hike_mountains (hike_id, mountain_id)
        SELECT ${hikeId}, m FROM unnest(${input.mountainIds}::int[]) AS m
      `;
    }
  }

  return { ok: true, value: { id: hikeId } };
}

// 回傳被刪除紀錄的 track_url，呼叫端負責把 R2 上那份孤兒檔案清掉
export async function deleteHike(hikeId: number, userId: number): Promise<WriteResult<{ trackUrl: string | null }>> {
  const owned = await assertOwned(hikeId, userId);
  if (owned !== 'ok') return { ok: false, reason: owned };

  // 刪掉就查不到了，網址要先取出來
  const trackRows = await sql`SELECT track_url AS "trackUrl" FROM hike_tracks WHERE hike_id = ${hikeId}`;
  const trackUrl = (trackRows[0]?.trackUrl as string) ?? null;

  // hike_tracks / hike_mountains 都以 hike_id 外鍵指向 hikes，
  // 用 CTE 一句刪完，避免刪到一半留下孤兒列
  await sql`
    WITH deleted_track AS (
      DELETE FROM hike_tracks WHERE hike_id = ${hikeId} RETURNING hike_id
    ),
    deleted_mountains AS (
      DELETE FROM hike_mountains WHERE hike_id = ${hikeId} RETURNING hike_id
    )
    DELETE FROM hikes WHERE id = ${hikeId}
  `;

  return { ok: true, value: { trackUrl } };
}
