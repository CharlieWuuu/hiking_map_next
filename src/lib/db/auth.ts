import 'server-only';

import { createHash, randomBytes } from 'crypto';

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

export type AuthMethods = {
  email: string | null;
  hasPassword: boolean;
  hasGoogle: boolean;
};

// 設定頁要顯示「這個帳號用哪些方式登入」
export async function getAuthMethods(userId: number): Promise<AuthMethods> {
  const rows = await sql`
    SELECT password IS NOT NULL AS "hasPassword", google_id IS NOT NULL AS "hasGoogle", email
    FROM users WHERE id = ${userId} LIMIT 1
  `;
  const row = rows[0];
  if (!row) return { hasPassword: false, hasGoogle: false, email: null };
  return { hasPassword: Boolean(row.hasPassword), hasGoogle: Boolean(row.hasGoogle), email: (row.email as string) ?? null };
}

// 設定 email。email 在 users 上是唯一索引，被其他帳號用掉時
// Postgres 會丟 23505，轉成看得懂的訊息而不是讓整個 Server Action 爆掉。
export async function setEmail(userId: number, email: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await sql`UPDATE users SET email = ${email} WHERE id = ${userId}`;
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === '23505') {
      return { ok: false, error: '這個 email 已經被其他帳號使用' };
    }
    throw error;
  }
}

// 解除 Google 綁定。只用 Google 註冊的帳號沒有密碼，
// 解綁後就再也登不進來了，所以擋下來。
export async function unlinkGoogle(userId: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const rows = await sql`SELECT password FROM users WHERE id = ${userId} LIMIT 1`;
  const user = rows[0];
  if (!user) return { ok: false, error: '找不到使用者' };
  if (!user.password) {
    return { ok: false, error: '這個帳號沒有設定密碼，解除綁定後將無法登入' };
  }
  await sql`UPDATE users SET google_id = NULL WHERE id = ${userId}`;
  return { ok: true };
}

// --- 密碼重設 ---

// 一小時足夠使用者去收信，又不會讓一條連結長期有效
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

// 明碼 token 只在信裡出現一次，資料庫存的是它的 SHA-256。
// 沿用 NestJS 時期的雜湊方式，先前寄出但還沒用的連結仍然有效。
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// 建立重設 token，回傳明碼 token 與收信人；email 不存在時回 null。
// 呼叫端無論如何都要回報成功，否則這支會變成帳號存在與否的查詢工具。
export async function createPasswordResetToken(email: string): Promise<{ token: string; username: string } | null> {
  const rows = await sql`SELECT id, username FROM users WHERE email = ${email} LIMIT 1`;
  const user = rows[0];
  if (!user) return null;

  // 同一個人重複點「忘記密碼」時，舊的連結立刻失效
  await sql`UPDATE password_reset_tokens SET used_at = now() WHERE user_id = ${user.id} AND used_at IS NULL`;

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  await sql`
    INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
    VALUES (${user.id}, ${hashToken(token)}, ${expiresAt.toISOString()})
  `;

  return { token, username: user.username as string };
}

// 憑 token 改密碼。過期、已用過、不存在都當成同一種失敗，
// 不告訴對方是哪一種。
export async function resetPasswordWithToken(token: string, newPassword: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const rows = await sql`
    SELECT id, user_id AS "userId" FROM password_reset_tokens
    WHERE token_hash = ${hashToken(token)} AND used_at IS NULL AND expires_at > now()
    LIMIT 1
  `;
  const record = rows[0];
  if (!record) return { ok: false, error: '連結已失效，請重新申請' };

  const hashed = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await sql`UPDATE users SET password = ${hashed} WHERE id = ${record.userId}`;
  await sql`UPDATE password_reset_tokens SET used_at = now() WHERE id = ${record.id}`;
  return { ok: true };
}

// --- Google 登入 ---

// 用 Google 的 sub 找帳號，沒有就開一個。
// username 由 email 的前半段推導，撞名時往後加數字。
export async function findOrCreateGoogleUser(googleId: string, email: string | null, displayName: string): Promise<AuthUser> {
  const existing = await sql`
    SELECT id, username, email, google_id AS "googleId" FROM users WHERE google_id = ${googleId} LIMIT 1
  `;
  if (existing[0]) {
    const user = existing[0];
    return { id: Number(user.id), username: user.username as string, email: (user.email as string) ?? null, googleId: (user.googleId as string) ?? null };
  }

  const base = (email?.split('@')[0] || displayName).replace(/[^a-zA-Z0-9_]/g, '') || 'hiker';
  let username = base;
  let suffix = 0;
  // 撞名就往後加數字。併發時仍可能兩個人同時選到同一個名字，
  // 這時 users.username 的唯一索引會擋下來，讓 INSERT 失敗而不是產生重複帳號。
  while ((await sql`SELECT 1 FROM users WHERE username = ${username} LIMIT 1`).length > 0) {
    suffix += 1;
    username = `${base}${suffix}`;
  }

  const inserted = await sql`
    INSERT INTO users (username, password, google_id, email)
    VALUES (${username}, NULL, ${googleId}, ${email})
    RETURNING id, username, email, google_id AS "googleId"
  `;
  const user = inserted[0];
  await sql`INSERT INTO profiles (user_id, avatar, description) VALUES (${user.id}, '', '')`;

  return { id: Number(user.id), username: user.username as string, email: (user.email as string) ?? null, googleId: (user.googleId as string) ?? null };
}

// 把 Google 帳號綁到現有帳號上。同一個 Google 帳號不能綁在兩個地方。
export async function linkGoogle(userId: number, googleId: string): Promise<{ ok: true } | { ok: false; error: 'conflict' }> {
  const existing = await sql`SELECT id FROM users WHERE google_id = ${googleId} LIMIT 1`;
  if (existing[0] && Number(existing[0].id) !== userId) return { ok: false, error: 'conflict' };
  await sql`UPDATE users SET google_id = ${googleId} WHERE id = ${userId}`;
  return { ok: true };
}
