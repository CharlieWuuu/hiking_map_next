import 'server-only';

import { randomUUID } from 'crypto';
import { promisify } from 'util';
import { gzip } from 'zlib';

import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const gzipAsync = promisify(gzip);

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

// 客戶端在模組載入時就建立，Lambda 之間可以重用連線
let client: S3Client | null = null;

function getClient(): S3Client {
  if (client) return client;
  client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
  return client;
}

function getPublicUrl(): string {
  const url = process.env.R2_PUBLIC_URL;
  if (!url) throw new Error('R2_PUBLIC_URL is not set');
  return url;
}

export type UploadImageResult = { ok: true; url: string } | { ok: false; reason: 'unsupported-type' | 'too-large' };

export async function uploadImage(file: File, folder: string): Promise<UploadImageResult> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) return { ok: false, reason: 'unsupported-type' };
  if (file.size > MAX_IMAGE_SIZE_BYTES) return { ok: false, reason: 'too-large' };

  const extension = file.type.split('/')[1];
  const key = `${folder}/${randomUUID()}.${extension}`;

  await getClient().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type,
    })
  );

  return { ok: true, url: `${getPublicUrl()}/${key}` };
}

// 上傳一份不會再變動的 JSON（目前用於完整軌跡）。
//
// key 帶隨機 uuid，內容有變就換一個 key，所以可以放心宣告 immutable——
// 瀏覽器會存進磁碟快取，之後同一條軌跡再也不會碰到網路。
// 這也順便處理了權限：R2 的公開網址沒有驗證，不可預測的 key 是私人紀錄唯一的保護。
export async function uploadImmutableJson(data: unknown, folder: string): Promise<string> {
  const key = `${folder}/${randomUUID()}.json`;
  const body = await gzipAsync(Buffer.from(JSON.stringify(data), 'utf8'));

  await getClient().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      Body: body,
      ContentType: 'application/json',
      // 瀏覽器看到這個標頭會自動解壓，fetch 端不需要做任何事
      ContentEncoding: 'gzip',
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );

  return `${getPublicUrl()}/${key}`;
}

// 依公開網址刪除物件。軌跡被編輯過後舊的那份就沒人會再讀，
// 留著只是讓一個仍可公開存取的網址永遠飄在外面——而不可預測的 key
// 正是私人紀錄唯一的保護，所以孤兒檔等於永久外流。
//
// 刪不掉不該讓呼叫端的流程失敗：資料本身已經寫好了，這只是清垃圾。
export async function deleteByUrl(url: string | null | undefined): Promise<void> {
  const publicUrl = getPublicUrl();
  // 只刪自己 bucket 底下的東西，避免有人塞別的網址進來
  if (!url?.startsWith(`${publicUrl}/`)) return;

  const key = url.slice(publicUrl.length + 1);
  try {
    await getClient().send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET!, Key: key }));
  } catch (error) {
    console.warn(`R2 物件 ${key} 沒能刪除，需要時再手動清理：${String(error)}`);
  }
}
