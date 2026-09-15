'use server';

import { updateProfile, type Profile } from './profile';
import { getSession } from './session';

// 給設定頁的 client component 用，取代原本的 PATCH /profile/me。
// userId 取自登入態，不接受用戶端傳入，否則可以改到別人的個人資料。
export async function updateMyProfile(dto: { avatar?: string; description?: string }): Promise<Profile | null> {
  const session = await getSession();
  if (!session) return null;
  return updateProfile(session.userId, dto);
}
