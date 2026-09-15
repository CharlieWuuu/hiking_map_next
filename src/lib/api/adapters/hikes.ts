import type {
  CreateHikeDto as RawCreateHikeDto,
  Hike as RawHike,
  HikeStatsDto as RawHikeStatsDto,
  InViewHikeDto as RawInViewHikeDto,
  MountainProgressDto as RawMountainProgressDto,
  UpdateHikeDto as RawUpdateHikeDto,
} from '../generated/data-contracts';
import type { Hikes as HikesClient } from '../generated/Hikes';
import { toCamelCase } from './case';

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
  // GET /hikes?includeGeojson=true 才會附帶，且只有簡化過的線
  geojson?: object | null;
  // GET /hikes/:id 才會附帶，這趟紀錄手動標記完成的山頭 id 清單
  mountainIds?: number[];
  // 這趟紀錄屬於哪些分類（百岳/小百岳/百大必訪步道），findAll/findAllPaginated 才會附帶
  categoryNames?: string[];
};

export type CreateHikeDto = {
  name: string;
  county?: string;
  town?: string;
  date: string;
  distanceKm: number;
  isPublic?: boolean;
  note?: string;
  urls?: string[];
  coverImageUrl?: string;
  trailId?: number;
  mountainIds?: number[];
  geojson: object;
};

export type UpdateHikeDto = {
  name?: string;
  county?: string;
  town?: string;
  date?: string;
  isPublic?: boolean;
  urls?: string[];
  note?: string;
  mountainIds?: number[];
};

export type MountainProgressItem = {
  id: number;
  name: string;
  elevationM: number;
};

export type MountainProgress = {
  hundred: { completed: MountainProgressItem[]; missing: MountainProgressItem[] };
  smallHundred: { completed: MountainProgressItem[]; missing: MountainProgressItem[] };
};

export type InViewHike = {
  id: number;
  name: string;
  center: [number, number] | null;
  bbox: [number, number, number, number] | null;
  pointCount: number | null;
  trackUrl: string | null;
  // 只有 includeGeojson=true 時才有值，這裡固定回 undefined 以外一律是簡化線
  geojson?: object | null;
};

export type PaginatedHikes = {
  items: Hike[];
  totalCount: number;
  nextCursor: string | null;
};

export type HikeStats = {
  totalDistanceKm: number;
  hikeCount: number;
  achievements: {
    hundred: number;
    smallHundred: number;
    hundredTrail: number;
  };
  monthlyDistance: { month: string; distanceKm: number }[];
  countyStats: { county: string; count: number }[];
};

export function adaptHike(raw: RawHike): Hike {
  return toCamelCase<RawHike>(raw) as Hike;
}

export function adaptHikeStats(raw: RawHikeStatsDto): HikeStats {
  return toCamelCase<RawHikeStatsDto>(raw) as HikeStats;
}

export function adaptInViewHike(raw: RawInViewHikeDto): InViewHike {
  return toCamelCase<RawInViewHikeDto>(raw) as InViewHike;
}

export function adaptMountainProgress(raw: RawMountainProgressDto): MountainProgress {
  return toCamelCase<RawMountainProgressDto>(raw) as MountainProgress;
}

export function toCreateHikeDto(dto: CreateHikeDto): RawCreateHikeDto {
  return {
    name: dto.name,
    county: dto.county,
    town: dto.town,
    date: dto.date,
    distance_km: dto.distanceKm,
    is_public: dto.isPublic,
    note: dto.note,
    urls: dto.urls,
    cover_image_url: dto.coverImageUrl,
    trail_id: dto.trailId,
    mountain_ids: dto.mountainIds,
    geojson: dto.geojson,
  };
}

export function toUpdateHikeDto(dto: UpdateHikeDto): RawUpdateHikeDto {
  return {
    name: dto.name,
    county: dto.county,
    town: dto.town,
    date: dto.date,
    is_public: dto.isPublic,
    urls: dto.urls,
    note: dto.note,
    mountain_ids: dto.mountainIds,
  };
}

export function createHikesService(client: HikesClient) {
  return {
    create: async (dto: CreateHikeDto) => adaptHike(await client.hikesControllerCreate(toCreateHikeDto(dto))),
    findAll: async (userId: string, includeGeojson = false, category?: string) =>
      (await client.hikesControllerFindAll({ userId, includeGeojson: includeGeojson ? 'true' : 'false', category })).map(adaptHike),
    findAllPaginated: async (userId: string, limit: number, cursor?: string, includeGeojson = false, category?: string): Promise<PaginatedHikes> => {
      const raw = await client.hikesControllerFindAllPaginated({
        userId,
        includeGeojson: includeGeojson ? 'true' : 'false',
        limit: String(limit),
        cursor,
        category,
      });
      return {
        items: raw.items.map(adaptHike),
        totalCount: raw.total_count,
        nextCursor: raw.next_cursor,
      };
    },
    findOne: async (id: number) => adaptHike(await client.hikesControllerFindOne(id)),
    // 地圖點某條路線時，清單要跳到它所在的那一頁；回傳的 cursor 是「跳到該頁」要帶的 cursor
    getPageInfo: async (id: number, userId: string, limit: number) => client.hikesControllerGetPageInfo(id, { userId: Number(userId), limit }),
    // zoom 給後端判斷要回點位／簡化線／完整軌跡，前端不用自己算該不該多打一次 R2 請求
    findInView: async (bbox: [number, number, number, number], userId?: string, zoom = 0, category?: string) =>
      (
        await client.hikesControllerFindInView({
          bbox: bbox.join(','),
          userId,
          zoom: String(zoom),
          category,
        })
      ).map(adaptInViewHike),
    update: async (id: number, dto: UpdateHikeDto) => adaptHike(await client.hikesControllerUpdate(id, toUpdateHikeDto(dto))),
    remove: (id: number) => client.hikesControllerRemove(id),
    getStats: async (username: string) => adaptHikeStats(await client.hikesControllerGetStats({ username })),
    getMountainProgress: async () => adaptMountainProgress(await client.hikesControllerGetMountainProgress()),
  };
}
