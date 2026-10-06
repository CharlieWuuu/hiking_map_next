import useSWR, { mutate } from 'swr';

import { fetchLastLocation, fetchNearbyTrails } from '../app/[locale]/search/actions';
import { fetchMountains, fetchReferenceLayers } from './db/hikes.query.actions';
import { fetchPopularQueries, fetchSearchSuggestions } from './db/search.actions';

// 客戶端資料請求集中在這裡，用 SWR 快取：同一份資料在不同元件、不同頁面之間共用，
// 換頁回來不必重抓。各 key 的前綴同時也是失效時的篩選條件（見 invalidateHikeQueries）。
export const QUERY_KEYS = {
  mountains: 'mountains',
  referenceLayers: (userId: string) => `reference-layers:${userId}`,
  hikePage: (userId: string, category: string | undefined, page: number, cursor: string | undefined) =>
    `hike-page:${userId}:${category ?? ''}:${page}:${cursor ?? ''}`,
  popularQueries: 'popular-queries',
  searchSuggestions: (query: string) => `search-suggestions:${query}`,
  nearbyTrails: 'nearby-trails',
};

// 一段瀏覽期間內不會自己變的資料：抓過就一直用快取，切回分頁、網路重連、重新掛載都不重抓。
// 真的變了（例如新增紀錄）由 invalidateHikeQueries 主動失效
export const CACHE_FOR_SESSION = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  revalidateIfStale: false,
} as const;

// 山頭清單：資料頁、編輯卡片的山頭選單、紀錄詳情頁共用同一份
export function useMountains() {
  return useSWR(QUERY_KEYS.mountains, () => fetchMountains(), CACHE_FOR_SESSION);
}

// 官方名單疊圖。資料量不小（百大必訪的簡化幾何合計約 435KB），
// enabled 為 false 時不發請求，等使用者第一次打開任一圖層才抓。
// 含「是否完成」所以 key 帶 userId，換人登入不會拿到別人的完成狀態
export function useReferenceLayers(userId: string, enabled: boolean) {
  return useSWR(enabled ? QUERY_KEYS.referenceLayers(userId) : null, () => fetchReferenceLayers(), {
    ...CACHE_FOR_SESSION,
    // 紀錄變動後快取被清掉重抓時，地圖上先留著舊圖層，不要整層閃一下消失
    keepPreviousData: true,
  });
}

export function usePopularQueries() {
  return useSWR(QUERY_KEYS.popularQueries, () => fetchPopularQueries(), CACHE_FOR_SESSION);
}

// 搜尋建議：同一個關鍵字打過一次就不再問伺服器。query 為空字串時不發請求
export function useSearchSuggestions(query: string) {
  return useSWR(query ? QUERY_KEYS.searchSuggestions(query) : null, () => fetchSearchSuggestions(query), {
    ...CACHE_FOR_SESSION,
    // 換關鍵字時先留著上一批建議，新結果回來再換，清單不會閃一下變空
    keepPreviousData: true,
  });
}

const TAIPEI_FALLBACK = { lat: 25.033, lng: 121.5654 };

// 附近路線：先定位，定位失敗改用使用者最新一筆紀錄的位置，未登入或沒有紀錄則退回台北。
// 定位本身也算進這次請求，快取後回到探索頁就不必再等定位
async function loadNearbyTrails() {
  const { lat, lng } = await new Promise<{ lat: number; lng: number }>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition((position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }), reject)
  ).catch(() =>
    fetchLastLocation()
      .catch(() => null)
      .then((lastLocation) => lastLocation ?? TAIPEI_FALLBACK)
  );
  return fetchNearbyTrails(lat, lng);
}

export function useNearbyTrails() {
  return useSWR(QUERY_KEYS.nearbyTrails, loadNearbyTrails, CACHE_FOR_SESSION);
}

// 紀錄新增、編輯、刪除後呼叫：官方名單的「是否完成」、資料頁的分頁、附近路線（含自己的紀錄）都可能變了。
// 清掉這些快取：畫面上正在用的會立刻重抓（搭配 keepPreviousData 期間仍顯示舊資料），
// 沒在用的下次用到才抓——它們設了 revalidateIfStale: false，不清掉的話會一直拿舊資料。
// exceptKey 用在呼叫端已經自己把該 key 的快取更新好（例如編輯後直接改掉目前這頁）的情況
export function invalidateHikeQueries(exceptKey?: string) {
  return mutate(
    (key) =>
      typeof key === 'string' && key !== exceptKey && (key.startsWith('reference-layers:') || key.startsWith('hike-page:') || key === QUERY_KEYS.nearbyTrails),
    undefined,
    { revalidate: true }
  );
}
