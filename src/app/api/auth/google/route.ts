import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';

// 把使用者導去 Google 的授權頁。
//
// 這裡不用 passport／next-auth：整個流程只有「導去 Google」和「收回呼」兩步，
// 自己寫反而比配置一套框架短，也不必再多一層對 session 的抽象——
// 本專案的 session 已經在 lib/db/session.ts 定好了。

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

// 綁定既有帳號時帶這個 state，回呼才知道要綁定而不是登入
export const GOOGLE_LINK_STATE = 'link';

export function getCallbackUrl(request: NextRequest): string {
  // 部署後的網域由 NEXT_PUBLIC_SITE_URL 指定；本機沒設就用請求自己的 origin
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin).replace(/\/+$/, '');
  return `${base}/api/auth/google/callback`;
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('GOOGLE_CLIENT_ID is not set');

  const mode = request.nextUrl.searchParams.get('mode');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getCallbackUrl(request),
    response_type: 'code',
    scope: 'openid email profile',
    // 綁定流程要能分辨，登入則不帶
    ...(mode === 'link' ? { state: GOOGLE_LINK_STATE } : {}),
  });

  redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
}
