'use server';

import { getSession } from './session';
import { uploadImage } from './storage';

export type UploadActionResult = { ok: true; url: string } | { ok: false; error: 'unauthorized' | 'unsupported-type' | 'too-large' };

// 只有登入者能上傳，否則等於開放任何人往 bucket 塞檔案。
// 檔案格式與大小的檢查在 uploadImage 裡，前端擋掉的只是體驗，伺服器端才算數。
export async function uploadImageAction(formData: FormData): Promise<UploadActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'unauthorized' };

  const file = formData.get('file');
  if (!(file instanceof File)) return { ok: false, error: 'unsupported-type' };

  const result = await uploadImage(file, 'images');
  if (!result.ok) return { ok: false, error: result.reason };

  return { ok: true, url: result.url };
}
