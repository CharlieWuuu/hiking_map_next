'use server';

import { revalidatePath } from 'next/cache';

import { createHike, deleteHike, updateHike, type CreateHikeInput, type UpdateHikeInput } from './hikes.write';
import { getSession } from './session';
import { deleteByUrl } from './storage';

export type HikeActionResult = { ok: true; id: number } | { ok: false; error: 'unauthorized' | 'not-found' | 'forbidden' | 'invalid-geometry' };

// 所有寫入都在這裡取登入者，userId 絕不從參數進來——
// 否則任何人都能改參數去新增或刪除別人的紀錄
export async function createHikeAction(input: CreateHikeInput): Promise<HikeActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'unauthorized' };

  const result = await createHike(session.userId, input);
  if (!result.ok) return { ok: false, error: result.reason as 'invalid-geometry' };

  // 首頁與資料頁都會列出紀錄，新增後要讓它們重新取資料
  revalidatePath('/', 'layout');

  return { ok: true, id: result.value.id };
}

export async function updateHikeAction(hikeId: number, input: UpdateHikeInput): Promise<HikeActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'unauthorized' };

  const result = await updateHike(hikeId, session.userId, input);
  if (!result.ok) return { ok: false, error: result.reason as 'not-found' | 'forbidden' };

  revalidatePath('/', 'layout');

  return { ok: true, id: result.value.id };
}

export async function deleteHikeAction(hikeId: number): Promise<HikeActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'unauthorized' };

  const result = await deleteHike(hikeId, session.userId);
  if (!result.ok) return { ok: false, error: result.reason as 'not-found' | 'forbidden' };

  // 紀錄刪了，R2 上那份完整軌跡沒人會再讀，留著只是個仍可公開存取的孤兒。
  // deleteByUrl 本身已吞掉錯誤——刪不掉不該讓刪除流程失敗
  await deleteByUrl(result.value.trackUrl);

  revalidatePath('/', 'layout');

  return { ok: true, id: hikeId };
}
