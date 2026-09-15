import { create } from 'zustand';

import type { InViewHike } from './api/adapters/hikes';
import { apiClient } from './apiClient';

export type LngLat = [number, number];

// 完整軌跡的快取上限，以「總點數」計而不是「幾條」——
// 一條路線可能 200 點也可能 8000 點，用條數當上限會估不準記憶體。
// 30 萬點約 20～40 MB，一般使用者根本碰不到，這個上限主要是防呆。
const MAX_CACHED_POINTS = 300_000;

// zoom 分層門檻：< CLUSTER_ZOOM 只顯示點位（cluster），
// CLUSTER_ZOOM ~ DETAIL_ZOOM 顯示簡化線，>= DETAIL_ZOOM 換完整軌跡
export const CLUSTER_ZOOM = 10;
export const DETAIL_ZOOM = 14;

type CachedTrack = {
  path: LngLat[];
  lastUsed: number;
};

type MapState = {
  // 目前選中／滑過的紀錄。原本散在 ProfileTrailExplorer 的 useState，
  // 移進來之後清單與地圖不必再靠 props 互相轉發
  hoverSlug: string | null;
  activeSlug: string | null;
  // 清單本身就有選中這筆的 bbox，選中當下順便帶過來，PanToActiveEffect 才能立即
  // fitBounds，不必等 findOne 打回來才知道要飛去哪裡（那支 API 主要是補 popup 文字用的）
  activeBbox: [number, number, number, number] | null;
  setHoverSlug: (slug: string | null) => void;
  setActiveSlug: (slug: string | null, bbox?: [number, number, number, number] | null) => void;

  // 目前地圖的縮放層級與視野範圍，決定要不要載入完整軌跡，也是 fetchInView 的輸入
  zoom: number;
  bounds: [number, number, number, number] | null;
  setViewport: (zoom: number, bounds: [number, number, number, number]) => void;

  // 視野內的紀錄（id/name/center/bbox，zoom >= CLUSTER_ZOOM 時另含簡化 geojson）。
  // 這是地圖自己動態抓的資料，跟頁面一次撈好傳進來的清單資料是分開的兩條線
  markers: InViewHike[];
  markersLoading: boolean;
  fetchInView: (bbox: [number, number, number, number], zoom: number, userId?: string, category?: string) => Promise<void>;

  // 已經解析成座標陣列的完整軌跡。壓縮檔本身由瀏覽器的 HTTP 快取負責留在磁碟，
  // 這裡只擋「重新解析」的成本，所以不必急著在離開視野時丟掉
  tracks: Map<string, CachedTrack>;
  loading: Set<string>;
  loadTrack: (slug: string, url: string) => Promise<void>;
  touchTracks: (slugs: string[]) => void;
};

export const useMapStore = create<MapState>((set, get) => ({
  hoverSlug: null,
  activeSlug: null,
  activeBbox: null,
  setHoverSlug: (slug) => set({ hoverSlug: slug }),
  setActiveSlug: (slug, bbox) => set({ activeSlug: slug, activeBbox: slug ? (bbox ?? null) : null }),

  zoom: 7,
  bounds: null,
  // 沒有實際變動就不要寫入。地圖在側邊欄收合期間會被持續 panTo，
  // 每次都換一個新的 bounds 陣列會讓訂閱者跟著空轉
  setViewport: (zoom, bounds) => {
    const previous = get().bounds;
    if (zoom === get().zoom && previous && previous.every((value, index) => value === bounds[index])) return;
    set({ zoom, bounds });
  },

  markers: [],
  markersLoading: false,
  fetchInView: async (bbox, zoom, userId, category) => {
    set({ markersLoading: true });
    try {
      // 後端依 zoom 判斷要回點位／簡化線／完整軌跡，這裡直接把 zoom 轉交過去就好
      const markers = await apiClient.hikes.findInView(bbox, userId, zoom, category);
      set({ markers });
    } catch {
      // 失敗就維持上一次抓到的結果，不清空畫面
    } finally {
      set({ markersLoading: false });
    }
  },

  tracks: new Map(),
  loading: new Set(),

  // 記下這些軌跡剛剛被用到，淘汰時才知道誰最久沒被碰到。
  // 直接改物件、不換 Map，所以不會觸發 re-render——這只是使用紀錄，不影響畫面
  touchTracks: (slugs) => {
    const { tracks } = get();
    const now = performance.now();
    for (const slug of slugs) {
      const cached = tracks.get(slug);
      if (cached) cached.lastUsed = now;
    }
  },

  loadTrack: async (slug, url) => {
    const { tracks, loading } = get();
    if (tracks.has(slug) || loading.has(slug)) return;

    set({ loading: new Set(loading).add(slug) });

    try {
      // 這裡看起來每次都在連網路，但物件是 immutable 的，
      // 第二次之後瀏覽器會直接從磁碟快取回應，不會真的出去
      const response = await fetch(url);
      if (!response.ok) throw new Error(`載入軌跡失敗：${response.status}`);
      const geometry = await response.json();
      const path = flattenPath(geometry);

      set((state) => {
        const next = new Map(state.tracks);
        next.set(slug, { path, lastUsed: performance.now() });
        return { tracks: evictOldest(next) };
      });
    } catch {
      // 失敗就維持顯示簡化線，不打斷使用者
    } finally {
      set((state) => {
        const next = new Set(state.loading);
        next.delete(slug);
        return { loading: next };
      });
    }
  },
}));

// 後端存的是 MultiLineString，這裡只取第一條線（與清單頁的處理一致）
function flattenPath(geometry: unknown): LngLat[] {
  if (!geometry || typeof geometry !== 'object' || !('type' in geometry) || !('coordinates' in geometry)) return [];
  if (geometry.type === 'LineString') return geometry.coordinates as LngLat[];
  if (geometry.type === 'MultiLineString') return (geometry.coordinates as LngLat[][])[0] ?? [];
  return [];
}

// 超過上限才淘汰，而且挑最久沒用到的。
// 不用「離開視野就丟」是因為使用者平移地圖來回晃時會一直重抓重解析
function evictOldest(tracks: Map<string, CachedTrack>): Map<string, CachedTrack> {
  let total = 0;
  for (const track of tracks.values()) total += track.path.length;
  if (total <= MAX_CACHED_POINTS) return tracks;

  const byAge = [...tracks.entries()].sort((a, b) => a[1].lastUsed - b[1].lastUsed);
  for (const [slug, track] of byAge) {
    if (total <= MAX_CACHED_POINTS) break;
    tracks.delete(slug);
    total -= track.path.length;
  }
  return tracks;
}
