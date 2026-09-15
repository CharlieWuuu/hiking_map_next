'use server';

import { findHikeById, findHikesInView, findHikesPaginated, getHikePageInfo, type Hike, type InViewHike } from './hikes';
import { findAllMountains, type Mountain } from './mountains';
import { getSession } from './session';

// 給 client component 用的查詢入口（資料頁的分頁、地圖的視野查詢）。
// userId 一律由伺服器端的登入態決定，不從參數進來——
// 否則改個參數就能翻閱別人的紀錄。

export async function fetchHikesPage(
  limit: number,
  cursor?: string,
  category?: string
): Promise<{ items: Hike[]; totalCount: number; nextCursor: string | null }> {
  const session = await getSession();
  if (!session) return { items: [], totalCount: 0, nextCursor: null };
  return findHikesPaginated(session.userId, limit, cursor, true, category);
}

export async function fetchHikePageInfo(hikeId: number, limit: number): Promise<{ page: number; cursor: string | null } | null> {
  const session = await getSession();
  if (!session) return null;
  return getHikePageInfo(hikeId, session.userId, limit);
}

export async function fetchHikesInView(bbox: [number, number, number, number], zoom: number, category?: string): Promise<InViewHike[]> {
  const session = await getSession();
  if (!session) return [];
  return findHikesInView(bbox, session.userId, zoom, category);
}

export async function fetchMountains(): Promise<Mountain[]> {
  // 山頭是公開的參考資料，不需要登入
  return findAllMountains();
}

// 地圖選中一條路線時要拿完整軌跡來畫。只回傳自己的紀錄——
// 封閉系統下沒有「看別人紀錄」這回事
export async function fetchHikeDetail(hikeId: number): Promise<Hike | null> {
  const session = await getSession();
  if (!session) return null;
  const hike = await findHikeById(hikeId);
  if (!hike || hike.userId !== session.userId) return null;
  return hike;
}
