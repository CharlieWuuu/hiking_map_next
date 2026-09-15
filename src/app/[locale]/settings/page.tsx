import { getTranslations } from 'next-intl/server';

import PageLayout from '../../../components/PageLayout';
import { Link } from '../../../i18n/navigation';
import { getAuthMethods } from '../../../lib/getAuthMethods';
import { getCurrentUser } from '../../../lib/getCurrentUser';
import AccountSecurity from './_components/AccountSecurity';
import LocaleSelector from './_components/LocaleSelector';
import LogoutButton from './_components/LogoutButton';
import ProfileSection from './_components/ProfileSection';
import ThemeSwitcher from './_components/ThemeSwitcher';

export default async function SettingsPage() {
  const t = await getTranslations('SettingsPage');
  // 未登入時拿不到，帳號安全區塊就整段不顯示
  const [authMethods, currentUser] = await Promise.all([getAuthMethods(), getCurrentUser()]);
  return (
    <PageLayout title={t('title')}>
      <div className="flex flex-col gap-4">
        {currentUser && <ProfileSection avatar={currentUser.avatar} description={currentUser.description} />}

        <div className="bg-panel rounded-panel divide-background-contrary/10 flex flex-col divide-y px-4">
          <LocaleSelector />
          <ThemeSwitcher />
        </div>
        {authMethods && <AccountSecurity initialMethods={authMethods} />}

        <div className="bg-panel rounded-panel px-4">
          <Link href="/settings/intro" className="text-accent flex w-full items-center justify-between py-3">
            {t('goToIntro')}
          </Link>
        </div>
        <div className="bg-panel rounded-panel px-4">
          <LogoutButton />
        </div>
      </div>
    </PageLayout>
  );
}
