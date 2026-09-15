'use client';

import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

import type { AuthMethods } from '../../../../lib/api/adapters/auth';
import { apiClient } from '../../../../lib/apiClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

type Props = {
  // 由設定頁在伺服器端取好傳進來，這裡就不需要在 effect 裡再抓一次
  initialMethods: AuthMethods;
};

export default function AccountSecurity({ initialMethods }: Props) {
  const t = useTranslations('AccountSecurity');

  const [methods, setMethods] = useState(initialMethods);
  const [email, setEmail] = useState(initialMethods.email ?? '');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Google 綁定是整頁跳走再跳回來，結果只能靠 query string 帶回
  const googleLink = useSearchParams().get('googleLink');

  async function reload() {
    const result = await apiClient.auth.getMethods().catch(() => null);
    if (!result) return;
    setMethods(result);
    setEmail(result.email ?? '');
  }

  async function saveEmail(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    try {
      await apiClient.auth.setEmail(email);
      await reload();
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  }

  async function unlinkGoogle() {
    try {
      await apiClient.auth.unlinkGoogle();
      await reload();
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-background-contrary/60 text-sm">{t('title')}</h2>

      <div className="bg-panel rounded-panel divide-background-contrary/10 flex flex-col divide-y px-4">
        <form onSubmit={saveEmail} className="flex flex-col gap-2 py-3">
          <label className="flex flex-col gap-1">
            <span className="flex items-baseline gap-2">
              <span className="text-sm">{t('email')}</span>
              {/* 沒有 email 就收不到重設信，這是唯一自助救回帳號的方式 */}
              <span className="text-background-contrary/60 text-xs">{methods.email ? t('emailHint') : t('emailMissingHint')}</span>
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-background-contrary bg-panel text-background-contrary mt-1 border-b px-1 py-1.5 outline-none"
            />
          </label>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={status === 'saving' || email === (methods.email ?? '')}
              className="bg-panel-active hover:bg-panel-active-lighten rounded-panel w-fit px-3 py-1.5 text-sm transition-colors disabled:opacity-50"
            >
              {t('saveEmail')}
            </button>
            {status === 'saved' && <span className="text-background-contrary/60 text-xs">{t('saved')}</span>}
            {status === 'error' && <span className="text-xs text-red-500">{t('saveFailed')}</span>}
          </div>
        </form>

        <div className="flex items-center justify-between gap-4 py-3">
          <div className="flex flex-col">
            <span className="flex items-baseline gap-2">
              <span className="text-sm">{t('google')}</span>
              <span className="text-background-contrary/60 text-xs">{methods.hasGoogle ? t('googleLinked') : t('googleHint')}</span>
            </span>
            {googleLink === 'conflict' && <span className="text-xs text-red-500">{t('googleConflict')}</span>}
          </div>

          {methods.hasGoogle ? (
            <button
              type="button"
              onClick={unlinkGoogle}
              // 只有 Google 能登入的帳號解綁後就再也進不來，後端也會擋
              disabled={!methods.hasPassword}
              title={methods.hasPassword ? undefined : t('googleUnlinkBlocked')}
              className="bg-panel-active hover:bg-panel-active-lighten rounded-panel shrink-0 px-3 py-1.5 text-sm transition-colors disabled:opacity-50"
            >
              {t('googleUnlink')}
            </button>
          ) : (
            <a
              href={`${API_BASE_URL}/auth/google?mode=link`}
              className="bg-panel-active hover:bg-panel-active-lighten rounded-panel shrink-0 px-3 py-1.5 text-sm transition-colors"
            >
              {t('googleLink')}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
