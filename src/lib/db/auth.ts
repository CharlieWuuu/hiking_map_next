import 'server-only';

import bcrypt from 'bcryptjs';

import { sql } from './index';

const BCRYPT_ROUNDS = 10;

export type AuthUser = {
  id: number;
  username: string;
  email: string | null;
  googleId: string | null;
};

// 密碼驗證失敗一律回傳 null，不區分「帳號不存在」與「密碼錯誤」，
// 避免讓人拿登入介面去枚舉哪些帳號存在
export async function validateUser(username: string, password: string): Promise<AuthUser | null> {
  const rows = await sql`
    SELECT id, username, email, password, google_id AS "googleId"
    FROM users
    WHERE username = ${username}
    LIMIT 1
  `;

  const user = rows[0];
  // 只用 Google 註冊的帳號 password 是 null，不能用密碼登入
  if (!user || !user.password) return null;

  const isValid = await bcrypt.compare(password, user.password as string);
  if (!isValid) return null;

  return { id: Number(user.id), username: user.username as string, email: (user.email as string) ?? null, googleId: (user.googleId as string) ?? null };
}

export type RegisterResult = { ok: true; user: AuthUser } | { ok: false; reason: 'username-taken' | 'email-taken' };

export async function registerUser(username: string, password: string, email?: string): Promise<RegisterResult> {
  const existing = await sql`SELECT id FROM users WHERE username = ${username} LIMIT 1`;
  if (existing.length > 0) return { ok: false, reason: 'username-taken' };

  if (email) {
    const emailTaken = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
    if (emailTaken.length > 0) return { ok: false, reason: 'email-taken' };
  }

  // 沿用與 NestJS 相同的 bcrypt cost，舊帳號的雜湊照樣驗得過，不需要遷移
  const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const rows = await sql`
    INSERT INTO users (username, password, email)
    VALUES (${username}, ${hashed}, ${email ?? null})
    RETURNING id, username, email, google_id AS "googleId"
  `;
  const user = rows[0];

  // 個人資料列與使用者一起建立，後續頁面才不用處理「profile 不存在」的情況
  await sql`INSERT INTO profiles (user_id, avatar, description) VALUES (${user.id}, '', '')`;

  return {
    ok: true,
    user: { id: Number(user.id), username: user.username as string, email: (user.email as string) ?? null, googleId: (user.googleId as string) ?? null },
  };
}

// 登入／登出留下稽核紀錄，與 NestJS 時期寫入同一張表
export async function writeAuditLog(userId: number, action: 'login' | 'logout', ip: string, userAgent: string): Promise<void> {
  await sql`
    INSERT INTO audit_logs (user_id, action, ip_address, user_agent)
    VALUES (${userId}, ${action}, ${ip}, ${userAgent})
  `;
}

// 設定頁要顯示「這個帳號用哪些方式登入」
export async function getAuthMethods(userId: number): Promise<{ hasPassword: boolean; hasGoogle: boolean; email: string | null }> {
  const rows = await sql`
    SELECT password IS NOT NULL AS "hasPassword", google_id IS NOT NULL AS "hasGoogle", email
    FROM users WHERE id = ${userId} LIMIT 1
  `;
  const row = rows[0];
  if (!row) return { hasPassword: false, hasGoogle: false, email: null };
  return { hasPassword: Boolean(row.hasPassword), hasGoogle: Boolean(row.hasGoogle), email: (row.email as string) ?? null };
}
