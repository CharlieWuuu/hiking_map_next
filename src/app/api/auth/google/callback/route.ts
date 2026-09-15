import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';

import { findOrCreateGoogleUser, linkGoogle, writeAuditLog } from '../../../../../lib/db/auth';
import { getSession, setSessionCookie, signSessionToken } from '../../../../../lib/db/session';
import { getCallbackUrl, GOOGLE_LINK_STATE } from '../route';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

type GoogleUserInfo = {
  sub: string;
  email?: string;
  name?: string;
};

// 拿授權碼換 access token，再換使用者資料。
// 兩步都失敗就當作整個流程失敗，不去猜是哪一步出錯。
async function exchangeCodeForProfile(code: string, redirectUri: string): Promise<GoogleUserInfo | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET is not set');

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  if (!tokenResponse.ok) return null;

  const { access_token: accessToken } = (await tokenResponse.json()) as { access_token?: string };
  if (!accessToken) return null;

  const userResponse = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!userResponse.ok) return null;

  return (await userResponse.json()) as GoogleUserInfo;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const isLinkMode = state === GOOGLE_LINK_STATE;

  // 使用者在 Google 那邊按了取消，或請求被竄改
  if (!code) redirect(isLinkMode ? '/settings?googleLink=failed' : '/login?error=google');

  const profile = await exchangeCodeForProfile(code, getCallbackUrl(request));
  if (!profile) redirect(isLinkMode ? '/settings?googleLink=failed' : '/login?error=google');

  // 綁定：把 Google 帳號接到目前登入的帳號上
  if (isLinkMode) {
    const session = await getSession();
    if (!session) redirect('/settings?googleLink=unauthenticated');

    const result = await linkGoogle(session.userId, profile.sub);
    redirect(result.ok ? '/settings?googleLink=success' : '/settings?googleLink=conflict');
  }

  // 登入：沒有對應帳號就開一個
  const user = await findOrCreateGoogleUser(profile.sub, profile.email ?? null, profile.name ?? '');
  const token = await signSessionToken({ userId: user.id, username: user.username });
  await setSessionCookie(token);

  const forwarded = request.headers.get('x-forwarded-for');
  await writeAuditLog(user.id, 'login', forwarded?.split(',')[0]?.trim() ?? '', request.headers.get('user-agent') ?? '');

  redirect('/');
}
