import { CircleUserRound } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import ChartLine from '../../components/ChartLine';
import ChartRing from '../../components/ChartRing';
import PageLayout from '../../components/PageLayout';
import TrailListItem from '../../components/TrailListItem';
import { Link } from '../../i18n/navigation';
import { findAllHikes, getAchievementTotals, getHikeStats } from '../../lib/db/hikes';
import { nearby } from '../../lib/db/search';
import { fillMonthlyDistance } from '../../lib/fillMonthlyDistance';
import { getCurrentUser } from '../../lib/getCurrentUser';

const MONTHLY_DISTANCE_MONTHS_COUNT = 24;
// 預設頭像 icon 的顏色要不透明：icon 是幾條交疊的線，半透明色會在交疊處疊深。
// 直接把 contrary 色混進頭像底色（panel-active），得到看起來一樣淡、但不透明的灰
const PLACEHOLDER_AVATAR_ICON_CLASS = 'h-16 w-16 text-[color-mix(in_srgb,var(--color-background-contrary)_60%,var(--color-panel-active))]';
const RECOMMENDED_TRAILS_COUNT = 5;
// 沒有任何紀錄可以判斷活動範圍時的預設地點（台北車站），與探索頁的備援一致
const TAIPEI_FALLBACK = { lat: 25.033, lng: 121.5654 };

export default async function Home() {
  const t = await getTranslations('HomePage');
  const tProfile = await getTranslations('ProfilePage');
  const tCharts = await getTranslations('HikeStatsCharts');
  const tCommon = await getTranslations('Common');
  const currentUser = await getCurrentUser();

  const [stats, hikes, guestAchievementTotals] = await Promise.all([
    currentUser ? getHikeStats(Number(currentUser.userId)).catch(() => null) : Promise.resolve(null),
    currentUser ? findAllHikes(Number(currentUser.userId)) : Promise.resolve([]),
    // 沒登入也照樣畫成就環（進度都是 0），讓人知道登入後會看到什麼；分母跟使用者無關
    currentUser ? Promise.resolve(null) : getAchievementTotals().catch(() => null),
  ]);
  // 首頁只當一份摘要，近期紀錄取前 5 筆就好；完整清單去 /data 看
  const RECENT_HIKES_COUNT = 5;
  const hikesByDateDesc = [...hikes].sort((a, b) => b.date.localeCompare(a.date));
  const recentHikes = hikesByDateDesc.slice(0, RECENT_HIKES_COUNT);

  // 推薦路線以「最近一次有軌跡的紀錄」為中心找附近的路線；沒有紀錄（或紀錄都沒軌跡）就用台北。
  // 直接用 hikes 帶回來的 center，不另外打 /search/last-location，省一次請求。
  // center 是 [lng, lat]
  const latestCenter = hikesByDateDesc.find((hike) => hike.center)?.center;
  const recommendOrigin = latestCenter ? { lat: latestCenter[1], lng: latestCenter[0] } : TAIPEI_FALLBACK;
  // 推薦區塊失敗不該讓整個首頁掛掉，抓不到就當作沒有這一區
  const recommendedTrails = await nearby(recommendOrigin.lat, recommendOrigin.lng)
    .then((results) => results.slice(0, RECOMMENDED_TRAILS_COUNT))
    .catch(() => []);
  // 統計只留一張最能一眼看出趨勢的圖，完整的六張圖表去 /chart 頁看。
  // 改成每月總距離而不是每筆紀錄一個點：紀錄一多，逐筆畫在同一張窄圖上會擠成一團看不出趨勢，
  // 按月加總後資料點數固定（近 12 個月），時間軸間距也均勻
  // 沒登入時一樣補滿 24 個月，畫成全為 0 的線，跟成就環的 0 一致
  const trendData = fillMonthlyDistance(stats?.monthlyDistance ?? [], MONTHLY_DISTANCE_MONTHS_COUNT).map((d) => ({
    date: `${d.month}-01`,
    value: d.distanceKm,
  }));
  const achievements = stats?.achievements ?? { hundred: 0, smallHundred: 0, hundredTrail: 0 };
  const achievementTotals = stats?.achievementTotals ?? guestAchievementTotals;

  return (
    <PageLayout>
      {/* 沒登入時各區塊照樣出現、只是沒有資料並提示登入——
          否則首頁只剩推薦路線，看不出這個網站是做什麼的 */}
      {currentUser ? (
        <div className="flex items-center gap-8">
          {currentUser.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentUser.avatar} alt="" className="border-accent rounded-panel h-30 w-30 shrink-0 border-4 object-cover" />
          ) : (
            <span className="bg-panel-active border-accent rounded-panel flex h-30 w-30 shrink-0 items-center justify-center border-4">
              <CircleUserRound className={PLACEHOLDER_AVATAR_ICON_CLASS} />
            </span>
          )}
          <div className="flex flex-col gap-2">
            <h1 className="text-accent text-3xl font-bold">{t('greeting', { username: currentUser.username })}</h1>
            {stats && (
              <div className="flex flex-wrap gap-4 text-lg">
                <Link href="/chart" className="hover:underline">
                  {t('totalDistanceValue', { distance: stats.totalDistanceKm })}
                </Link>
                <span>{t('hikeCountValue', { count: stats.hikeCount })}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-8">
          <span className="bg-panel-active border-accent rounded-panel flex h-30 w-30 shrink-0 items-center justify-center border-4">
            <CircleUserRound className={PLACEHOLDER_AVATAR_ICON_CLASS} />
          </span>
          <div className="flex flex-col items-start gap-3">
            <p className="text-lg">{t('loginPrompt')}</p>
            <Link href="/login" className="bg-panel-active hover:bg-panel-active-lighten rounded-panel px-4 py-2 text-sm transition-colors">
              {t('loginCta')}
            </Link>
          </div>
        </div>
      )}

      {achievementTotals && (
        <div className="flex flex-wrap justify-around gap-4">
          <ChartRing label={tProfile('achievementHundred')} value={achievements.hundred} total={achievementTotals.hundred} />
          <ChartRing label={tProfile('achievementSmallHundred')} value={achievements.smallHundred} total={achievementTotals.smallHundred} />
          <ChartRing label={tProfile('achievementHundredTrail')} value={achievements.hundredTrail} total={achievementTotals.hundredTrail} />
        </div>
      )}

      <div className="bg-panel rounded-panel flex h-50 flex-col gap-4 p-4">
        <span className="text-background-contrary/60 text-sm">{tCharts('distanceTrend')}</span>
        <ChartLine data={trendData} emptyLabel={tCommon('noData')} unit={tCharts('unitKm')} />
      </div>

      {!currentUser && (
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">{t('latestHike')}</h2>
          <Link
            href="/login"
            className="bg-panel rounded-panel text-background-contrary/60 hover:text-background-contrary flex h-24 items-center justify-center text-sm transition-colors"
          >
            {t('loginRequired')}
          </Link>
        </section>
      )}

      {currentUser && recentHikes.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">{t('latestHike')}</h2>
          {recentHikes.map((hike) => (
            <TrailListItem
              key={hike.id}
              href={`/hikes/${hike.id}`}
              name={hike.name}
              county={hike.county ?? ''}
              town={hike.town ?? ''}
              date={hike.date}
              distanceKm={hike.distanceKm}
            />
          ))}
          <Link href="/data" className="bg-panel-active hover:bg-panel-active-lighten rounded-panel mx-auto w-fit px-4 py-2 text-sm transition-colors">
            {t('viewAllHikes')}
          </Link>
        </section>
      )}

      {recommendedTrails.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">{t('recommendedTrails')}</h2>
          {recommendedTrails.map((trail) => (
            <TrailListItem
              key={trail.slug}
              href={`/trails/${trail.slug}`}
              name={trail.displayName}
              county={trail.county ?? ''}
              town={trail.town ?? ''}
              badges={trail.categoryName ? [{ label: trail.categoryName, tone: 'neutral' }] : undefined}
            />
          ))}
          <Link href="/search" className="bg-panel-active hover:bg-panel-active-lighten rounded-panel mx-auto w-fit px-4 py-2 text-sm transition-colors">
            {t('exploreMoreTrails')}
          </Link>
        </section>
      )}
    </PageLayout>
  );
}
