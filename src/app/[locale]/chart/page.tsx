import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import ChartRing from '../../../components/ChartRing';
import HikeStatsCharts from '../../../components/HikeStatsCharts';
import MountainProgress from '../../../components/MountainProgress';
import PageLayout from '../../../components/PageLayout';
import { apiClient } from '../../../lib/apiClient';
import { findAllHikes, getHikeStats } from '../../../lib/db/hikes';
import { getCurrentUser } from '../../../lib/getCurrentUser';

export default async function ChartPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login');

  const [stats, mountainProgress] = await Promise.all([
    getHikeStats(Number(currentUser.userId)).catch(() => null),
    apiClient.hikes.getMountainProgress().catch(() => null),
  ]);
  if (!stats) redirect('/login');

  const hikes = await findAllHikes(Number(currentUser.userId));

  const t = await getTranslations('ProfilePage');

  return (
    <PageLayout title={t('title')}>
      {/* 用單一容器包住兩個區塊，才能自己控制彼此間距，
          不受 PageLayout 給多個 children 用的較大間距影響 */}
      <div className="flex flex-col gap-4">
        {/* 總覽數據 + 成就：各半版寬並排 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="bg-accent text-accent-contrast rounded-panel flex flex-col justify-between gap-6 p-6">
            <span className="text-sm font-medium opacity-70">{t('totalDistanceLabel')}</span>
            <div className="flex flex-1 flex-col items-start justify-center gap-2">
              <span className="text-4xl font-bold sm:text-6xl">{t('totalDistance', { distance: stats.totalDistanceKm })}</span>
              <span className="text-sm opacity-70">{t('hikeCount', { count: stats.hikeCount })}</span>
            </div>
          </div>
          <div className="bg-highlight text-highlight-contrast rounded-panel flex flex-wrap items-center justify-around gap-4 p-6">
            <ChartRing label={t('achievementHundred')} value={stats.achievements.hundred} />
            <ChartRing label={t('achievementSmallHundred')} value={stats.achievements.smallHundred} />
            <ChartRing label={t('achievementHundredTrail')} value={stats.achievements.hundredTrail} />
          </div>
        </div>

        {mountainProgress && <MountainProgress progress={mountainProgress} />}

        {/* 圖表：兩兩一排 */}
        <HikeStatsCharts stats={stats} hikes={hikes} />
      </div>
    </PageLayout>
  );
}
