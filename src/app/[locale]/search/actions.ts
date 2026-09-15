'use server';

import { nearby, lastLocation as queryLastLocation, type SearchResult } from '../../../lib/db/search';
import { getCurrentUser } from '../../../lib/getCurrentUser';

// NearbyTrails 需要瀏覽器定位，只能是 client component，沒辦法直接查資料庫。
// 這裡用 Server Action 當作它的入口——等同原本的 GET /search/nearby，
// 但走的是 Next.js 內建的 RPC，不需要另外架一台後端、也沒有 CORS。

export async function fetchNearbyTrails(lat: number, lng: number): Promise<SearchResult[]> {
  return nearby(lat, lng);
}

// 定位失敗時的備援：使用者最新一筆紀錄的位置。
// userId 一律由伺服器端的登入態決定，不接受用戶端傳入，
// 否則任何人都能改參數去查別人的位置。
export async function fetchLastLocation(): Promise<{ lat: number; lng: number } | null> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;
  return queryLastLocation(Number(currentUser.userId));
}
