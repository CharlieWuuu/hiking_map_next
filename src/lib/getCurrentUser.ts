import 'server-only';

import { findProfileByUserId, type Profile } from './db/profile';
import { getSession } from './db/session';

// server component 用：取得目前請求的登入者（沒登入或 token 失效則回傳 null）。
// 用於判斷 isOwner 之類的顯示邏輯，不做強制導轉——頁面本身通常是公開的。
//
// 認證改在 Next.js 內完成後，這裡直接驗 cookie 裡的 JWT 再查資料庫，
// 不再打 NestJS 的 /profile/me。回傳形狀與原本相同，呼叫端不用改。
export async function getCurrentUser(): Promise<Profile | null> {
  const session = await getSession();
  if (!session) return null;

  // token 有效但使用者已被刪除時，profile 會查不到，一樣視為未登入
  return findProfileByUserId(session.userId);
}
