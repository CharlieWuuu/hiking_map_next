'use server';

import { headers } from 'next/headers';

import { getAuthMethods as queryAuthMethods, registerUser, validateUser, writeAuditLog } from './auth';
import { clearSessionCookie, getSession, setSessionCookie, signSessionToken } from './session';

export type AuthActionResult = { ok: true; username: string } | { ok: false; error: 'invalid-credentials' | 'username-taken' | 'email-taken' };

// 稽核紀錄要的來源資訊。部署在 Vercel 時真實 IP 在 x-forwarded-for，
// req.ip 會是邊緣節點的位址
async function getRequestMeta(): Promise<{ ip: string; userAgent: string }> {
  const headerList = await headers();
  const forwarded = headerList.get('x-forwarded-for');
  return {
    ip: forwarded?.split(',')[0]?.trim() ?? '',
    userAgent: headerList.get('user-agent') ?? '',
  };
}

export async function login(username: string, password: string): Promise<AuthActionResult> {
  const user = await validateUser(username, password);
  // 帳號不存在與密碼錯誤回傳同一種錯誤，不讓人藉此枚舉帳號
  if (!user) return { ok: false, error: 'invalid-credentials' };

  const token = await signSessionToken({ userId: user.id, username: user.username });
  await setSessionCookie(token);

  const { ip, userAgent } = await getRequestMeta();
  // 稽核寫入失敗不該讓使用者登不進來
  await writeAuditLog(user.id, 'login', ip, userAgent).catch(() => {});

  return { ok: true, username: user.username };
}

export async function register(username: string, password: string, email?: string): Promise<AuthActionResult> {
  const result = await registerUser(username, password, email);
  if (!result.ok) return { ok: false, error: result.reason };

  // 註冊完直接給登入狀態，不必再讓使用者登入一次
  const token = await signSessionToken({ userId: result.user.id, username: result.user.username });
  await setSessionCookie(token);

  return { ok: true, username: result.user.username };
}

export async function logout(): Promise<void> {
  const session = await getSession();
  if (session) {
    const { ip, userAgent } = await getRequestMeta();
    await writeAuditLog(session.userId, 'logout', ip, userAgent).catch(() => {});
  }
  await clearSessionCookie();
}

// client component（例如 zustand 的 authStore）要知道目前登入者是誰。
// 這裡不回傳整份 profile，只給頁面實際需要的 id 與 username
export async function getCurrentSession(): Promise<{ userId: number; username: string } | null> {
  return getSession();
}

export async function getAuthMethods(): Promise<{ hasPassword: boolean; hasGoogle: boolean; email: string | null } | null> {
  const session = await getSession();
  if (!session) return null;
  return queryAuthMethods(session.userId);
}
