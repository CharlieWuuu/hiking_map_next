import { useTranslations } from 'next-intl';

import { Link } from '../../i18n/navigation';

export default function NotFound() {
  const t = useTranslations('NotFoundPage');
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1>{t('title')}</h1>
      <p className="text-background-contrary/60 text-sm">{t('description')}</p>
      <Link href="/" className="text-accent">
        {t('backHome')}
      </Link>
    </div>
  );
}
