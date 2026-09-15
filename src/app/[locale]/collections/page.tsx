import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import BackLink from '../../../components/BackLink';
import PageLayout from '../../../components/PageLayout';
import TrailListItem from '../../../components/TrailListItem';
import { apiClient } from '../../../lib/apiClient';
import { getCurrentUser } from '../../../lib/getCurrentUser';

export default async function CollectionsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login');

  const collections = await apiClient.collections.findAll().catch(() => []);
  const t = await getTranslations('ProfileCollectionsPage');

  return (
    <PageLayout title={t('title')} before={<BackLink href="/chart">{t('backToProfile')}</BackLink>}>
      {collections.length === 0 ? (
        <p className="text-background-contrary/60 text-sm">{t('empty')}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {collections.map((item) =>
            item.itemType === 'trail' ? (
              <TrailListItem key={`trail-${item.id}`} href={`/trails/${item.trailSlug}`} name={item.trailName ?? ''} county="" town="" />
            ) : null
          )}
        </div>
      )}
    </PageLayout>
  );
}
