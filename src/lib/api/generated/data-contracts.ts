/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface RegisterDto {
  /** @example "hiker01" */
  username: string;
  /** @example "password123" */
  password: string;
  /** @example "hiker01@example.com" */
  email?: string;
}

export interface RegisterResponseDto {
  /** @example 1 */
  id: number;
  /** @example "hiker01" */
  username: string;
}

export interface LoginDto {
  /** @example "hiker01" */
  username: string;
  /** @example "password123" */
  password: string;
}

export interface LoginResponseDto {
  /** @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." */
  token: string;
}

export interface AuthMethodsDto {
  /** @example "hiker01@example.com" */
  email?: object | null;
  /**
   * 是否設定過密碼
   * @example true
   */
  has_password: boolean;
  /**
   * 是否綁定 Google
   * @example false
   */
  has_google: boolean;
}

export interface SetEmailDto {
  /** @example "hiker01@example.com" */
  email: string;
}

export interface ForgotPasswordDto {
  /** @example "hiker01@example.com" */
  email: string;
}

export interface ResetPasswordDto {
  /** @example "5f1c…（信裡連結帶的 token）" */
  token: string;
  /** @example "newPassword123" */
  password: string;
}

export interface TrailsInfoDto {
  name?: string;
  county?: string;
  town?: string;
  time?: string;
  url?: string;
  note?: string;
  public?: boolean;
}

export interface Profile {
  /** @example 1 */
  id: number;
  /** @example 1 */
  user_id: number;
  /** @example "https://example.com/avatar.png" */
  avatar: string;
  /** @example "喜歡爬百岳的登山愛好者" */
  description: string;
}

export interface UpdateProfileDto {
  /** @example "https://example.com/avatar.png" */
  avatar?: string;
  /** @example "喜歡爬百岳的登山愛好者" */
  description?: string;
}

export interface CreateHikeDto {
  /** @example "合歡山主峰步道" */
  name: string;
  /** @example "南投縣" */
  county?: string;
  /** @example "仁愛鄉" */
  town?: string;
  /** @example "2026-07-20" */
  date: string;
  /** @example 5.2 */
  distance_km: number;
  /** @example true */
  is_public?: boolean;
  /** @example "天氣很好，view 很棒" */
  note?: string;
  /** @example ["https://example.com/track.gpx"] */
  urls?: string[];
  /** @example "https://pub-xxxx.r2.dev/hikes/1/cover.jpg" */
  cover_image_url?: string;
  /** @example 1 */
  trail_id?: number;
  /** @example [1,2] */
  mountain_ids?: number[];
  /** @example {"type":"FeatureCollection","features":[]} */
  geojson: object;
}

export interface UpdateHikeDto {
  /** @example "合歡山主峰步道" */
  name?: string;
  /** @example "南投縣" */
  county?: string;
  /** @example "仁愛鄉" */
  town?: string;
  /** @example "2026-07-20" */
  date?: string;
  /** @example true */
  is_public?: boolean;
  /** @example ["https://example.com/track.gpx"] */
  urls?: string[];
  /** @example "天氣很好，view 很棒" */
  note?: string;
  /** @example [1,2] */
  mountain_ids?: number[];
}

export interface Hike {
  /** @example 1 */
  id: number;
  /** @example 1 */
  user_id: number;
  /** @example 1 */
  trail_id?: object | null;
  /** @example "合歡山主峰步道" */
  name: string;
  /** @example "南投縣" */
  county?: object | null;
  /** @example "仁愛鄉" */
  town?: object | null;
  /** @example "2026-07-20" */
  date: string;
  /** @example 5.2 */
  distance_km: number;
  /** @example true */
  is_public: boolean;
  /** @example "天氣很好，view 很棒" */
  note?: object | null;
  /** @example ["https://example.com/track.gpx"] */
  urls?: string[];
  /** @example "https://pub-xxxx.r2.dev/hikes/1/cover.jpg" */
  cover_image_url?: object | null;
  /**
   * @format date-time
   * @example "2026-07-20T10:00:00.000Z"
   */
  created_at: string;
  /** GET /hikes/:id 才會附帶，這趟紀錄手動標記完成的山頭 id 清單 */
  mountain_ids?: number[];
}

export interface InViewHikeDto {
  /** @example 1 */
  id: number;
  /** @example "合歡山主峰步道" */
  name: string;
  /** @example [121.5,25.0] */
  center: number[] | null;
  /** @example [121.4,24.9,121.6,25.1] */
  bbox: number[] | null;
  /** @example 42 */
  point_count: number | null;
  /** @example "https://pub-xxxx.r2.dev/hikes/1/track.json" */
  track_url: string | null;
  /** includeGeojson=true 才會有值，簡化過的軌跡座標 */
  geojson?: object | null;
}

export interface AchievementsDto {
  /** @example 12 */
  hundred: number;
  /** @example 28 */
  small_hundred: number;
  /** @example 45 */
  hundred_trail: number;
}

export interface MonthlyDistanceDto {
  /** @example "2026-06" */
  month: string;
  /** @example 15.8 */
  distance_km: number;
}

export interface CountyStatDto {
  /** @example "南投縣" */
  county: string;
  /** @example 4 */
  count: number;
}

export interface HikeStatsDto {
  /** @example 128.6 */
  total_distance_km: number;
  /** @example 24 */
  hike_count: number;
  achievements: AchievementsDto;
  monthly_distance: MonthlyDistanceDto[];
  county_stats: CountyStatDto[];
}

export interface MountainProgressItemDto {
  /** @example 1 */
  id: number;
  /** @example "玉山主峰" */
  name: string;
  /** @example 3952 */
  elevation_m: number;
}

export interface MountainProgressCategoryDto {
  completed: MountainProgressItemDto[];
  missing: MountainProgressItemDto[];
}

export interface MountainProgressDto {
  hundred: MountainProgressCategoryDto;
  small_hundred: MountainProgressCategoryDto;
}

export interface Mountain {
  /** @example 1 */
  id: number;
  /** @example "玉山主峰" */
  name: string;
  /** @example 3952 */
  elevation_m: number;
  /** @example {"type":"Point","coordinates":[120.9576,23.4707]} */
  location: object;
  /** @example "中央山脈" */
  range?: object | null;
  /** @example "南投縣" */
  county?: object | null;
  /** @example ["百岳"] */
  categories?: string[];
}

export interface Trail {
  /** @example 1 */
  id: number;
  /** @example "塔塔加登山口至排雲山莊" */
  name: string;
  /** @example "tataka-trailhead-to-paiyun-lodge" */
  slug: string;
  /** @example "南投縣" */
  county?: object | null;
  /** @example "信義鄉" */
  town?: object | null;
  /** @example "玉山主線經典路線" */
  description?: object | null;
  /** @example 8.5 */
  distance_km?: object | null;
  /** @example "https://pub-xxxx.r2.dev/trails/1/cover.jpg" */
  cover_image_url?: object | null;
}

export interface TrailDetailDto {
  /** @example 1 */
  id: number;
  /** @example "塔塔加登山口至排雲山莊" */
  name: string;
  /** @example "tataka-trailhead-to-paiyun-lodge" */
  slug: string;
  /** @example "玉山主線經典路線" */
  description?: object | null;
  /** @example 8.5 */
  distance_km?: object | null;
  /**
   * 路線座標，GeoJSON LineString
   * @example {"type":"LineString","coordinates":[[120.9,23.47]]}
   */
  geojson?: object | null;
  /** @example ["百岳","百大必訪步道"] */
  category_names: string[];
}

export interface CollectionItemDto {
  /** @example 1 */
  id: number;
  /** @example "trail" */
  item_type: 'trail' | 'hike' | 'user';
  /** @example 1 */
  item_id: number;
  /**
   * @format date-time
   * @example "2026-07-20T10:00:00.000Z"
   */
  created_at: string;
  /** @example "塔塔加登山口至排雲山莊" */
  trail_name?: object | null;
  /** @example "tataka-trailhead-to-paiyun-lodge" */
  trail_slug?: object | null;
  /** @example "hiker01" */
  username?: object | null;
  /** @example "https://example.com/avatar.png" */
  avatar?: object | null;
}

export interface CreateCollectionDto {
  /** @example "trail" */
  item_type: 'trail' | 'hike' | 'user';
  /** @example 1 */
  item_id: number;
}

export interface Collection {
  /** @example 1 */
  id: number;
  /** @example 1 */
  user_id: number;
  /** @example "trail" */
  item_type: 'trail' | 'hike' | 'user';
  /** @example 1 */
  item_id: number;
  /**
   * @format date-time
   * @example "2026-07-20T10:00:00.000Z"
   */
  created_at: string;
}

export interface SearchResultDto {
  /** @example "trail" */
  type: 'trail' | 'hike';
  /** @example "tataka-trailhead-to-paiyun-lodge" */
  slug: string;
  /** @example "塔塔加登山口至排雲山莊" */
  display_name: string;
  /** @example "南投縣" */
  county?: object | null;
  /** @example "信義鄉" */
  town?: object | null;
  /** @example "https://pub-xxxx.r2.dev/trails/1/cover.jpg" */
  cover_image_url?: object | null;
  /** @example "name" */
  match_reason: 'name' | 'field';
  /**
   * 距離查詢座標的距離（公里），只有 nearby 查詢會帶這個欄位
   * @example 12.3
   */
  distance_km?: number;
  /**
   * 分類名稱（百岳/小百岳/百大必訪步道），只有 nearby 查詢會帶這個欄位
   * @example "百岳"
   */
  category_name?: string;
}

export interface PopularQueryDto {
  /** @example "象山親山步道" */
  text: string;
}

export interface LogSearchQueryDto {
  /** @example "象山親山步道" */
  query: string;
}
