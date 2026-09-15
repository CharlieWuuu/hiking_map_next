'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Link, useRouter } from '../../../i18n/navigation';
import { useAuth } from '../../../lib/authStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

export default function LoginPage() {
  const t = useTranslations('LoginPage');
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(username, password);
      router.push('/');
    } catch {
      setError(t('error'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8">
      <h1 className="text-3xl font-bold">{t('title')}</h1>

      <form onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col gap-6">
        <label className="flex flex-col gap-1">
          <span className="text-background-contrary/60 text-sm">{t('username')}</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="border-background-contrary bg-panel text-background-contrary border-b px-1 py-1.5 outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-background-contrary/60 text-sm">{t('password')}</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border-background-contrary bg-panel text-background-contrary border-b px-1 py-1.5 outline-none"
          />
        </label>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Link href="/forgot-password" className="text-background-contrary/60 hover:text-background-contrary self-start text-sm transition-colors">
          {t('forgotPassword')}
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-panel-active hover:bg-panel-active-lighten rounded-panel w-fit self-center px-4 py-2 transition-colors disabled:opacity-50"
        >
          {t('submit')}
        </button>
      </form>

      <div className="flex w-full max-w-xs items-center gap-3 text-sm">
        <div className="bg-panel-active h-px flex-1" />
        <span className="text-background-contrary/60">{t('orDivider')}</span>
        <div className="bg-panel-active h-px flex-1" />
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <a
          href={`${API_BASE_URL}/auth/google`}
          className="bg-panel hover:bg-panel-active rounded-panel flex items-center justify-center gap-2 px-4 py-2 transition-colors"
        >
          {t('oauth.google')}
        </a>
      </div>
    </div>
  );
}
