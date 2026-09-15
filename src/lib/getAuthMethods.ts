import { cookies } from 'next/headers';

import type { AuthMethods } from './api/adapters/auth';
import { apiClient } from './apiClient';

// server component 用：取得目前登入者有哪些登入方式（email／密碼／Google）。
// 在伺服器端先拿到，設定頁的元件就不需要在 effect 裡補一次抓取。
export async function getAuthMethods(): Promise<AuthMethods | null> {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token')?.value;
  if (!authToken) return null;

  try {
    return await apiClient.auth.getMethods({ headers: { Cookie: `auth_token=${authToken}` } });
  } catch {
    return null;
  }
}
