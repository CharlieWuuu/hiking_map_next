'use client';

import { useTranslations } from 'next-intl';

import Switch from '../../../../components/Switch';
import { useTheme } from '../../../../hooks/useTheme';

export default function ThemeSwitcher() {
  const t = useTranslations('SettingsPage');
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex w-full items-center justify-between py-3">
      <span>{t('darkMode')}</span>
      <Switch checked={theme === 'dark'} onChange={(next) => setTheme(next ? 'dark' : 'light')} />
    </div>
  );
}
