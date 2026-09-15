'use client';

import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { Link, useRouter } from '../../../i18n/navigation';
import { apiClient } from '../../../lib/apiClient';

const MIN_PASSWORD_LENGTH = 8;

function ResetPasswordForm() {
  const t = useTranslations('ResetPasswordPage');
  const router = useRouter();
  const token = useSearchParams().get('token');

  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 連結沒帶 token 就沒什麼好做的，直接請使用者重新申請
  if (!token) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <h1 className="text-3xl font-bold">{t('invalidTitle')}</h1>
        <Link href="/forgot-password" className="bg-panel hover:bg-panel-active rounded-panel px-4 py-2 text-sm transition-colors">
          {t('requestAgain')}
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmation) {
      setError(t('mismatch'));
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await apiClient.auth.resetPassword(token!, password);
      router.push('/login');
    } catch {
      // 過期、用過、或根本是亂編的 token，後端一律回同一個錯誤
      setError(t('expired'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8">
      <h1 className="text-3xl font-bold">{t('title')}</h1>

      <form onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col gap-6">
        <label className="flex flex-col gap-1">
          <span className="text-background-contrary/60 text-sm">{t('newPassword')}</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={MIN_PASSWORD_LENGTH}
            className="border-background-contrary bg-panel text-background-contrary border-b px-1 py-1.5 outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-background-contrary/60 text-sm">{t('confirmPassword')}</span>
          <input
            type="password"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            required
            minLength={MIN_PASSWORD_LENGTH}
            className="border-background-contrary bg-panel text-background-contrary border-b px-1 py-1.5 outline-none"
          />
        </label>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-panel-active hover:bg-panel-active-lighten rounded-panel w-fit self-center px-4 py-2 transition-colors disabled:opacity-50"
        >
          {t('submit')}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  // useSearchParams 需要 Suspense 邊界，否則整頁會被強制轉成動態渲染
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
