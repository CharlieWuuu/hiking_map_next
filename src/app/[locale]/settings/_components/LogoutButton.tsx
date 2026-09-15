'use client';

import { useTranslations } from 'next-intl';

import { useRouter } from '../../../../i18n/navigation';
import { useAuth } from '../../../../lib/authStore';

export default function LogoutButton() {
  const t = useTranslations('SettingsPage');
  const router = useRouter();
  const { isLoggedIn, isLoading, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  if (isLoading) return null;

  if (!isLoggedIn) {
    return (
      <button type="button" onClick={() => router.push('/login')} className="text-accent flex w-full items-center justify-between py-3">
        {t('login')}
      </button>
    );
  }

  return (
    <button type="button" onClick={handleLogout} className="flex w-full items-center justify-between py-3 text-red-400">
      {t('logout')}
    </button>
  );
}
