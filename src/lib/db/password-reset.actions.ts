'use server';

import { sendMail } from '../mail';
import { createPasswordResetToken, resetPasswordWithToken } from './auth';

// 無論 email 存不存在都回傳成功，否則這支會變成帳號存在與否的查詢工具
export async function requestPasswordReset(email: string): Promise<void> {
  const created = await createPasswordResetToken(email);
  if (!created) return;

  // 重設連結要指回自己。Vercel 上由 NEXT_PUBLIC_SITE_URL 指定，
  // 本機沒設就退回 localhost
  // 結尾的斜線要去掉，否則連結會變成 //reset-password
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:4219').replace(/\/+$/, '');
  const link = `${baseUrl}/reset-password?token=${created.token}`;

  await sendMail(
    email,
    '重設你的健行軌跡密碼',
    `<p>你好 ${created.username}，</p>
     <p>點下面的連結重設密碼，一小時內有效：</p>
     <p><a href="${link}">${link}</a></p>
     <p>如果不是你本人操作，忽略這封信即可，密碼不會有任何變動。</p>`
  );
}

export async function resetPassword(token: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  return resetPasswordWithToken(token, password);
}
