import 'server-only';

import { sql } from './index';

export type Profile = {
  id: number;
  userId: number;
  username: string;
  avatar: string;
  description: string;
};

export async function findProfileByUserId(userId: number): Promise<Profile | null> {
  const rows = await sql`
    SELECT p.id, p.user_id AS "userId", u.username, p.avatar, p.description
    FROM profiles p
    JOIN users u ON u.id = p.user_id
    WHERE p.user_id = ${userId}
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) return null;

  return {
    id: Number(row.id),
    userId: Number(row.userId),
    username: row.username as string,
    // avatar / description 允許為空，統一成空字串，前端就不必再處理 null
    avatar: (row.avatar as string) ?? '',
    description: (row.description as string) ?? '',
  };
}

export async function findProfileByUsername(username: string): Promise<Profile | null> {
  const rows = await sql`
    SELECT p.id, p.user_id AS "userId", u.username, p.avatar, p.description
    FROM profiles p
    JOIN users u ON u.id = p.user_id
    WHERE u.username = ${username}
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) return null;

  return {
    id: Number(row.id),
    userId: Number(row.userId),
    username: row.username as string,
    avatar: (row.avatar as string) ?? '',
    description: (row.description as string) ?? '',
  };
}

export async function updateProfile(userId: number, dto: { avatar?: string; description?: string }): Promise<Profile | null> {
  // COALESCE 讓沒帶到的欄位保持原值，不必為了「只改其中一個」而拼接 SQL
  await sql`
    UPDATE profiles
    SET avatar = COALESCE(${dto.avatar ?? null}, avatar),
        description = COALESCE(${dto.description ?? null}, description)
    WHERE user_id = ${userId}
  `;
  return findProfileByUserId(userId);
}
