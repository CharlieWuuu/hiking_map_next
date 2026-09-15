import 'server-only';

import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';

// 認證從 NestJS 搬過來時，刻意維持完全相同的格式，
// 已經登入的人不會因為這次搬遷被登出：
//   - cookie 名稱 auth_token、httpOnly、sameSite lax、7 天
//   - JWT payload { sub, username }、HS256、7 天到期
//   - 密鑰同樣讀 JWT_SECRET
export const AUTH_COOKIE = 'auth_token';
const AUTH_COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const JWT_EXPIRES_IN = '7d';

export type SessionPayload = {
  userId: number;
  username: string;
};

// 缺 JWT_SECRET 就讓它直接失敗，不要用預設值——那等於把簽章變成公開資訊，
// 任何人都能自己簽一個 token 冒充別人
function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ sub: String(payload.userId), username: payload.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const userId = Number(payload.sub);
    // sub 不是數字（被竄改或格式不符）就當作無效，而不是讓 NaN 流進查詢
    if (!Number.isInteger(userId)) return null;
    return { userId, username: String(payload.username ?? '') };
  } catch {
    // 過期、簽章不符、格式錯誤都一律當作未登入
    return null;
  }
}

// Server Component / Server Action 取得目前登入者。
// 只驗 token 本身，不查資料庫——呼叫端需要完整使用者資料時再自己查。
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
    path: '/',
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
}
