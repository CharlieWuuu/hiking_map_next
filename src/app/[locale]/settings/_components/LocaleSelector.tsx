'use client';

import { useLocale, useTranslations } from 'next-intl';

import { usePathname, useRouter } from '../../../../i18n/navigation';
import { routing } from '../../../../i18n/routing';

const LOCALE_LABEL: Record<(typeof routing.locales)[number], string> = {
  'zh-TW': '繁體中文',
  en: 'English',
};

export default function LocaleSelector() {
  const t = useTranslations('SettingsPage');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex w-full items-center justify-between py-3">
      <span>{t('language')}</span>
      <select
        value={locale}
        onChange={(e) => router.replace(pathname, { locale: e.target.value })}
        className="bg-panel rounded-panel text-background-contrary h-7 cursor-pointer px-3"
      >
        {routing.locales.map((loc) => (
          <option key={loc} value={loc}>
            {LOCALE_LABEL[loc]}
          </option>
        ))}
      </select>
    </div>
  );
}
