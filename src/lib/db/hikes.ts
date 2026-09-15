import 'server-only';

import { sql } from './index';

// ST_AsGeoJSON 的小數位數。6 位約等於 0.1 公尺的精度，對登山軌跡綽綽有餘，
// 再多只是讓回傳的 JSON 變大
const GEOJSON_PRECISION = 6;

const CATEGORY_KEY_TO_NAME: Record<string, string> = {
  hundred: '百岳',
  smallHundred: '小百岳',
  hundredTrail: '百大必訪步道',
};

const CATEGORY_NAME_TO_ACHIEVEMENT_KEY: Record<string, 'hundred' | 'smallHundred' | 'hundredTrail'> = {
  百岳: 'hundred',
  小百岳: 'smallHundred',
  百大必訪步道: 'hundredTrail',
};

export type Hike = {
  id: number;
  userId: number;
  trailId: number | null;
  name: string;
  county: string | null;
  town: string | null;
  date: string;
  distanceKm: number;
  isPublic: boolean;
  note: string | null;
  urls: string[];
  coverImageUrl: string | null;
  createdAt: string;
  // 軌跡的 meta，很小所以一律附帶
  center: [number, number] | null;
  bbox: [number, number, number, number] | null;
  pointCount: number | null;
  // 完整軌跡在 R2 的網址，放大或匯出時由瀏覽器直接抓
  trackUrl: string | null;
  geojson?: object | null;
  mountainIds?: number[];
  categoryNames?: string[];
};

export type HikeStats = {
  totalDistanceKm: number;
  hikeCount: number;
  achievements: { hundred: number; smallHundred: number; hundredTrail: number };
  monthlyDistance: { month: string; distanceKm: number }[];
  countyStats: { county: string; count: number }[];
};

// 資料庫回傳的軌跡 meta 欄位，拆成 center / bbox 陣列給前端，
// 前端就不必再解一次 GeoJSON
type TrackMetaRow = {
  lng: number | null;
  lat: number | null;
  minLng: number | null;
  minLat: number | null;
  maxLng: number | null;
  maxLat: number | null;
  pointCount: number | null;
  trackUrl: string | null;
};

function toTrackMeta(row: Partial<TrackMetaRow> | undefined) {
  if (!row) return { center: null, bbox: null, pointCount: null, trackUrl: null };
  const { lng, lat, minLng, minLat, maxLng, maxLat } = row;
  return {
    center: lng === null || lng === undefined || lat === null || lat === undefined ? null : ([Number(lng), Number(lat)] as [number, number]),
    bbox:
      minLng === null ||
      minLng === undefined ||
      minLat === null ||
      minLat === undefined ||
      maxLng === null ||
      maxLng === undefined ||
      maxLat === null ||
      maxLat === undefined
        ? null
        : ([Number(minLng), Number(minLat), Number(maxLng), Number(maxLat)] as [number, number, number, number]),
    pointCount: row.pointCount === null || row.pointCount === undefined ? null : Number(row.pointCount),
    trackUrl: row.trackUrl ?? null,
  };
}

// 一筆 hike 屬於哪些分類：百岳/小百岳看它標記了哪些山（hike_mountains），
// 百大必訪步道則看對應的 trail。用 UNION 而不是 JOIN，避免一筆 hike 對到多座山時重複列出。
async function fetchCategoryNames(hikeIds: number[]): Promise<Map<number, string[]>> {
  const map = new Map<number, string[]>();
  if (hikeIds.length === 0) return map;

  const rows = await sql`
    SELECT hm.hike_id AS "hikeId", c.name AS "categoryName"
    FROM hike_mountains hm
    JOIN mountain_category_map mcm ON mcm.mountain_id = hm.mountain_id
    JOIN categories c ON c.id = mcm.category_id
    WHERE hm.hike_id = ANY(${hikeIds})
    UNION
    SELECT h.id AS "hikeId", c.name AS "categoryName"
    FROM hikes h
    JOIN trail_category_map tcm ON tcm.trail_id = h.trail_id
    JOIN categories c ON c.id = tcm.category_id
    WHERE h.id = ANY(${hikeIds})
  `;

  for (const row of rows) {
    const id = Number(row.hikeId);
    if (!map.has(id)) map.set(id, []);
    map.get(id)!.push(row.categoryName as string);
  }
  return map;
}

function toHike(row: Record<string, unknown>): Hike {
  return {
    id: Number(row.id),
    userId: Number(row.userId),
    trailId: row.trailId === null ? null : Number(row.trailId),
    name: row.name as string,
    county: (row.county as string) ?? null,
    town: (row.town as string) ?? null,
    // date 由 SQL 端就用 TO_CHAR 轉成 YYYY-MM-DD 字串。
    // 不能讓驅動把 DATE 轉成 Date 物件再 toISOString()——那會以本地時區午夜解讀、
    // 再轉回 UTC，在 UTC+8 會整批少一天
    date: String(row.date),
    distanceKm: Number(row.distanceKm),
    isPublic: Boolean(row.isPublic),
    note: (row.note as string) ?? null,
    urls: (row.urls as string[]) ?? [],
    coverImageUrl: (row.coverImageUrl as string) ?? null,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    ...toTrackMeta(row as Partial<TrackMetaRow>),
  };
}

const HIKE_COLUMNS = `
  h.id,
  h.user_id AS "userId",
  h.trail_id AS "trailId",
  h.name,
  h.county,
  h.town,
  TO_CHAR(h.date, 'YYYY-MM-DD') AS date,
  h.distance_km AS "distanceKm",
  h.is_public AS "isPublic",
  h.note,
  h.urls,
  h.cover_image_url AS "coverImageUrl",
  h.created_at AS "createdAt",
  ST_X(t.center) AS "lng",
  ST_Y(t.center) AS "lat",
  ST_XMin(t.bbox) AS "minLng",
  ST_YMin(t.bbox) AS "minLat",
  ST_XMax(t.bbox) AS "maxLng",
  ST_YMax(t.bbox) AS "maxLat",
  t.point_count AS "pointCount",
  t.track_url AS "trackUrl"
`;

export async function findAllHikes(userId: number, category?: string): Promise<Hike[]> {
  const categoryName = category ? CATEGORY_KEY_TO_NAME[category] : null;
  // 不明的分類直接回空陣列，而不是當成「不篩選」回傳全部
  if (category && !categoryName) return [];

  const rows = await sql`
    SELECT ${sql.unsafe(HIKE_COLUMNS)}
    FROM hikes h
    LEFT JOIN hike_tracks t ON t.hike_id = h.id
    WHERE h.user_id = ${userId}
      AND (
        ${categoryName}::text IS NULL
        OR EXISTS (
          SELECT 1 FROM hike_mountains hm
          JOIN mountain_category_map mcm ON mcm.mountain_id = hm.mountain_id
          JOIN categories c ON c.id = mcm.category_id
          WHERE hm.hike_id = h.id AND c.name = ${categoryName}
        )
        OR EXISTS (
          SELECT 1 FROM trail_category_map tcm
          JOIN categories c ON c.id = tcm.category_id
          WHERE tcm.trail_id = h.trail_id AND c.name = ${categoryName}
        )
      )
    ORDER BY h.date DESC, h.id DESC
  `;

  const hikes = rows.map(toHike);
  const categoryMap = await fetchCategoryNames(hikes.map((h) => h.id));
  return hikes.map((h) => ({ ...h, categoryNames: categoryMap.get(h.id) ?? [] }));
}

export async function findHikeById(id: number): Promise<Hike | null> {
  const rows = await sql`
    SELECT ${sql.unsafe(HIKE_COLUMNS)},
      ST_AsGeoJSON(t.geom, ${GEOJSON_PRECISION}) AS geojson
    FROM hikes h
    LEFT JOIN hike_tracks t ON t.hike_id = h.id
    WHERE h.id = ${id}
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) return null;

  const mountainRows = await sql`SELECT mountain_id AS "mountainId" FROM hike_mountains WHERE hike_id = ${id}`;

  return {
    ...toHike(row),
    // 單筆詳細頁只有一條軌跡，直接給完整座標，不必走 R2 那層
    geojson: row.geojson ? JSON.parse(row.geojson as string) : null,
    mountainIds: mountainRows.map((r) => Number(r.mountainId)),
  };
}

export async function getHikeStats(userId: number): Promise<HikeStats> {
  const [totals, monthlyDistance, countyStats, mountainAchievements, hundredTrail] = await Promise.all([
    sql`SELECT COALESCE(SUM(distance_km), 0) AS "totalDistanceKm", COUNT(*) AS "hikeCount" FROM hikes WHERE user_id = ${userId}`,
    sql`SELECT TO_CHAR(date, 'YYYY-MM') AS month, SUM(distance_km) AS "distanceKm"
        FROM hikes WHERE user_id = ${userId} GROUP BY month ORDER BY month`,
    sql`SELECT county, COUNT(*) AS count
        FROM hikes WHERE user_id = ${userId} AND county IS NOT NULL
        GROUP BY county ORDER BY count DESC`,
    // 百岳／小百岳算「不重複完成幾座山」：同一座山爬三次也只算一座，
    // 這才是完成度的定義（跟 hike 筆數不同）
    sql`SELECT c.name AS "categoryName", COUNT(DISTINCT hm.mountain_id) AS count
        FROM hike_mountains hm
        JOIN hikes h ON h.id = hm.hike_id
        JOIN mountain_category_map mcm ON mcm.mountain_id = hm.mountain_id
        JOIN categories c ON c.id = mcm.category_id
        WHERE h.user_id = ${userId}
        GROUP BY c.name`,
    // 百大必訪步道本來就是路線層級的屬性，跟爬了哪座山無關
    sql`SELECT COUNT(DISTINCT h.id) AS count
        FROM hikes h
        JOIN trail_category_map tcm ON tcm.trail_id = h.trail_id
        JOIN categories c ON c.id = tcm.category_id
        WHERE h.user_id = ${userId} AND c.name = '百大必訪步道'`,
  ]);

  const achievements = { hundred: 0, smallHundred: 0, hundredTrail: 0 };
  for (const row of mountainAchievements) {
    const key = CATEGORY_NAME_TO_ACHIEVEMENT_KEY[row.categoryName as string];
    if (key) achievements[key] = Number(row.count);
  }
  achievements.hundredTrail = Number(hundredTrail[0]?.count ?? 0);

  return {
    totalDistanceKm: Number(totals[0].totalDistanceKm),
    hikeCount: Number(totals[0].hikeCount),
    achievements,
    monthlyDistance: monthlyDistance.map((row) => ({ month: row.month as string, distanceKm: Number(row.distanceKm) })),
    countyStats: countyStats.map((row) => ({ county: row.county as string, count: Number(row.count) })),
  };
}

// 地圖依 zoom 分層載入的門檻：
// < CLUSTER_ZOOM 只給點位（遠景 cluster），CLUSTER_ZOOM ~ DETAIL_ZOOM 給簡化線，
// >= DETAIL_ZOOM 直接給完整軌跡——選中單一路線平移過去常常一步就跨進 DETAIL_ZOOM，
// 一次到位就不必再讓前端另外跑一趟去 R2 抓，也不會有「先粗後細」的過渡
const CLUSTER_ZOOM = 10;
const DETAIL_ZOOM = 14;

export type PaginatedHikes = {
  items: Hike[];
  totalCount: number;
  nextCursor: string | null;
};

// cursor 用 `date_id`（例如 '2026-07-20_42'）編碼。
// (date, id) 複合排序才不會因為同一天有多筆而重複或漏筆
function parseCursor(cursor: string): { date: string; id: number } | null {
  const [date, idRaw] = cursor.split('_');
  const id = Number(idRaw);
  if (!date || !Number.isInteger(id)) return null;
  return { date, id };
}

export async function findHikesPaginated(userId: number, limit: number, cursor?: string, includeGeojson = false, category?: string): Promise<PaginatedHikes> {
  const categoryName = category ? CATEGORY_KEY_TO_NAME[category] : null;
  if (category && !categoryName) return { items: [], totalCount: 0, nextCursor: null };

  const parsed = cursor ? parseCursor(cursor) : null;
  // cursor 格式錯誤時當作從頭開始，而不是丟出錯誤讓整頁掛掉
  const cursorDate = parsed?.date ?? null;
  const cursorId = parsed?.id ?? null;

  // 分類條件用參數化的 (參數 IS NULL OR 條件)，不把值拼進 SQL 字串
  const [countRows, rows] = await Promise.all([
    sql`
      SELECT COUNT(*) AS n FROM hikes h
      WHERE h.user_id = ${userId}
        AND (
          ${categoryName}::text IS NULL
          OR EXISTS (
            SELECT 1 FROM hike_mountains hm
            JOIN mountain_category_map mcm ON mcm.mountain_id = hm.mountain_id
            JOIN categories c ON c.id = mcm.category_id
            WHERE hm.hike_id = h.id AND c.name = ${categoryName}
          )
          OR EXISTS (
            SELECT 1 FROM trail_category_map tcm
            JOIN categories c ON c.id = tcm.category_id
            WHERE tcm.trail_id = h.trail_id AND c.name = ${categoryName}
          )
        )
    `,
    // 多拿一筆用來判斷還有沒有下一頁，不必另外查一次
    sql`
      SELECT ${sql.unsafe(HIKE_COLUMNS)}
        ${sql.unsafe(includeGeojson ? `, ST_AsGeoJSON(t.geom_simplified, ${GEOJSON_PRECISION}) AS geojson` : '')}
      FROM hikes h
      LEFT JOIN hike_tracks t ON t.hike_id = h.id
      WHERE h.user_id = ${userId}
        AND (
          ${categoryName}::text IS NULL
          OR EXISTS (
            SELECT 1 FROM hike_mountains hm
            JOIN mountain_category_map mcm ON mcm.mountain_id = hm.mountain_id
            JOIN categories c ON c.id = mcm.category_id
            WHERE hm.hike_id = h.id AND c.name = ${categoryName}
          )
          OR EXISTS (
            SELECT 1 FROM trail_category_map tcm
            JOIN categories c ON c.id = tcm.category_id
            WHERE tcm.trail_id = h.trail_id AND c.name = ${categoryName}
          )
        )
        AND (
          ${cursorDate}::date IS NULL
          OR h.date < ${cursorDate}::date
          OR (h.date = ${cursorDate}::date AND h.id < ${cursorId})
        )
      ORDER BY h.date DESC, h.id DESC
      LIMIT ${limit + 1}
    `,
  ]);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const items = page.map((row) => ({
    ...toHike(row),
    ...(includeGeojson ? { geojson: row.geojson ? JSON.parse(row.geojson as string) : null } : {}),
  }));

  const categoryMap = await fetchCategoryNames(items.map((h) => h.id));
  const mountainMap = await fetchMountainIds(items.map((h) => h.id));
  const withRelations = items.map((h) => ({
    ...h,
    categoryNames: categoryMap.get(h.id) ?? [],
    mountainIds: mountainMap.get(h.id) ?? [],
  }));

  const last = withRelations[withRelations.length - 1];
  return {
    items: withRelations,
    totalCount: Number(countRows[0].n),
    nextCursor: hasMore && last ? `${last.date}_${last.id}` : null,
  };
}

// 讓清單頁進編輯模式時不必再另外查一次才能顯示已標記的山頭
async function fetchMountainIds(hikeIds: number[]): Promise<Map<number, number[]>> {
  const map = new Map<number, number[]>();
  if (hikeIds.length === 0) return map;

  const rows = await sql`
    SELECT hike_id AS "hikeId", mountain_id AS "mountainId"
    FROM hike_mountains WHERE hike_id = ANY(${hikeIds})
  `;
  for (const row of rows) {
    const id = Number(row.hikeId);
    if (!map.has(id)) map.set(id, []);
    map.get(id)!.push(Number(row.mountainId));
  }
  return map;
}

// 地圖點了一條不在目前這頁的紀錄時，用來算出它在第幾頁、以及跳過去要用的 cursor
export async function getHikePageInfo(hikeId: number, userId: number, limit: number): Promise<{ page: number; cursor: string | null } | null> {
  const rows = await sql`SELECT TO_CHAR(date, 'YYYY-MM-DD') AS date, id FROM hikes WHERE id = ${hikeId} AND user_id = ${userId} LIMIT 1`;
  const hike = rows[0];
  if (!hike) return null;

  // 排在它前面的筆數，即為它在整份清單中的序位
  const rankRows = await sql`
    SELECT COUNT(*) AS n FROM hikes
    WHERE user_id = ${userId}
      AND (date > ${hike.date}::date OR (date = ${hike.date}::date AND id > ${hike.id}))
  `;
  const rank = Number(rankRows[0].n);
  const page = Math.floor(rank / limit) + 1;

  if (rank === 0) return { page, cursor: null };

  // 取得「那一頁的前一筆」當作 cursor
  const cursorRows = await sql`
    SELECT TO_CHAR(date, 'YYYY-MM-DD') AS date, id FROM hikes
    WHERE user_id = ${userId}
    ORDER BY date DESC, id DESC
    OFFSET ${rank - 1} LIMIT 1
  `;
  const c = cursorRows[0];
  return { page, cursor: c ? `${c.date}_${c.id}` : null };
}

export type InViewHike = {
  id: number;
  name: string;
  center: [number, number] | null;
  bbox: [number, number, number, number] | null;
  pointCount: number | null;
  trackUrl: string | null;
  geojson: object | null;
};

// 只回傳 bbox 與目前視野相交的紀錄，走 hike_tracks 的 GiST 索引，
// 資料量長大以後就不必再把整個人的軌跡一次送到前端
export async function findHikesInView(bbox: [number, number, number, number], userId?: number, zoom = 0, category?: string): Promise<InViewHike[]> {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const categoryName = category ? CATEGORY_KEY_TO_NAME[category] : null;
  if (category && !categoryName) return [];

  // 遠 zoom 只需要點位置，geojson 欄位整個不查、不傳，省頻寬
  const geojsonSelect =
    zoom >= DETAIL_ZOOM
      ? `, ST_AsGeoJSON(t.geom, ${GEOJSON_PRECISION}) AS geojson`
      : zoom >= CLUSTER_ZOOM
        ? `, ST_AsGeoJSON(t.geom_simplified, ${GEOJSON_PRECISION}) AS geojson`
        : '';

  const rows = await sql`
    SELECT h.id, h.name,
      ST_X(t.center) AS "lng", ST_Y(t.center) AS "lat",
      ST_XMin(t.bbox) AS "minLng", ST_YMin(t.bbox) AS "minLat",
      ST_XMax(t.bbox) AS "maxLng", ST_YMax(t.bbox) AS "maxLat",
      t.point_count AS "pointCount", t.track_url AS "trackUrl"
      ${sql.unsafe(geojsonSelect)}
    FROM hike_tracks t
    JOIN hikes h ON h.id = t.hike_id
    WHERE t.bbox && ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)
      AND (${userId ?? null}::int IS NULL OR h.user_id = ${userId ?? null})
      AND (
        ${categoryName}::text IS NULL
        OR EXISTS (
          SELECT 1 FROM hike_mountains hm
          JOIN mountain_category_map mcm ON mcm.mountain_id = hm.mountain_id
          JOIN categories c ON c.id = mcm.category_id
          WHERE hm.hike_id = h.id AND c.name = ${categoryName}
        )
        OR EXISTS (
          SELECT 1 FROM trail_category_map tcm
          JOIN categories c ON c.id = tcm.category_id
          WHERE tcm.trail_id = h.trail_id AND c.name = ${categoryName}
        )
      )
  `;

  return rows.map((row) => ({
    id: Number(row.id),
    name: row.name as string,
    ...toTrackMeta(row as Partial<TrackMetaRow>),
    geojson: row.geojson ? JSON.parse(row.geojson as string) : null,
  }));
}
