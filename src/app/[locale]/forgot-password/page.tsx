'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Link } from '../../../i18n/navigation';
import { apiClient } from '../../../lib/apiClient';

export default function ForgotPasswordPage() {
  const t = useTranslations('ForgotPasswordPage');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    // 後端一律回傳成功，所以這裡也不分「有沒有這個 email」——
    // 否則這個畫面會變成查詢帳號是否存在的工具
    await apiClient.auth.forgotPassword(email).catch(() => {});
    setIsSent(true);
    setIsSubmitting(false);
  }

  if (isSent) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <h1 className="text-3xl font-bold">{t('sentTitle')}</h1>
        <p className="text-background-contrary/60 max-w-xs text-center text-sm">{t('sentDescription')}</p>
        <Link href="/login" className="bg-panel hover:bg-panel-active rounded-panel px-4 py-2 text-sm transition-colors">
          {t('backToLogin')}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8">
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      <p className="text-background-contrary/60 max-w-xs text-center text-sm">{t('description')}</p>

      <form onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col gap-6">
        <label className="flex flex-col gap-1">
          <span className="text-background-contrary/60 text-sm">{t('email')}</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border-background-contrary bg-panel text-background-contrary border-b px-1 py-1.5 outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-panel-active hover:bg-panel-active-lighten rounded-panel w-fit self-center px-4 py-2 transition-colors disabled:opacity-50"
        >
          {t('submit')}
        </button>
      </form>

      <Link href="/login" className="text-background-contrary/60 hover:text-background-contrary text-sm transition-colors">
        {t('backToLogin')}
      </Link>
    </div>
  );
}
