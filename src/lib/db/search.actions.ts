'use server';

import { getCurrentUser } from '../getCurrentUser';
import { logQuery, popularQueries, search, type SearchResult } from './search';

// 給 client component 用的入口。SearchBar 要邊打字邊給建議，只能在瀏覽器端執行，
// 所以透過 Server Action 回到伺服器查資料庫，取代原本的 GET /search。

export async function fetchSearchSuggestions(query: string): Promise<SearchResult[]> {
  // 登入時搜尋範圍會包含自己的紀錄，userId 由伺服器端的登入態決定，
  // 不接受用戶端傳入，否則可以改參數去搜別人的紀錄
  const currentUser = await getCurrentUser();
  return search(query, currentUser ? Number(currentUser.userId) : undefined);
}

export async function fetchPopularQueries(): Promise<string[]> {
  return popularQueries();
}

// 只有使用者真正送出搜尋才呼叫；打字中的即時建議不會記錄，避免統計失真
export async function logSearchQuery(query: string): Promise<void> {
  await logQuery(query);
}
