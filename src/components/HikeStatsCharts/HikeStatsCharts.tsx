import { getTranslations } from 'next-intl/server';

import type { Hike, HikeStats } from '../../lib/api/adapters/hikes';
import { fillMonthlyDistance, fillMonthlyDistanceFromFirstYear } from '../../lib/fillMonthlyDistance';
import { getDistanceBucketCounts, getWeekdayCounts } from '../../lib/hikeStatsDerived';
import ChartBar from '../ChartBar';
import ChartHeatmap from '../ChartHeatmap';
import ChartLine from '../ChartLine';

const COUNTY_STATS_COUNT = 7;
const MONTHLY_DISTANCE_MONTHS_COUNT = 12;
const TREND_MONTHS_COUNT = 24;
const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const DISTANCE_BUCKET_KEYS = ['under3', '3to5', '5to8', '8to12', '12to20', 'over20'] as const;

type Props = {
  // 未登入或查無資料時傳 null，圖表會畫出空的座標軸
  stats: Pick<HikeStats, 'monthlyDistance' | 'countyStats'> | null;
  hikes: Pick<Hike, 'date' | 'distanceKm'>[];
};

export default async function HikeStatsCharts({ stats, hikes }: Props) {
  const t = await getTranslations('HikeStatsCharts');
  const tCommon = await getTranslations('Common');

  const monthlyData = fillMonthlyDistance(stats?.monthlyDistance ?? [], MONTHLY_DISTANCE_MONTHS_COUNT).map((d) => ({
    label: String(Number(d.month.slice(5))),
    value: d.distanceKm,
  }));
  // 熱度圖要看得出「一路走來」的完整密度，不像趨勢長條圖只截最近 12 個月；
  // 從最早紀錄那一年的 1 月開始排，讓每欄（半年）自然對齊 1-6 月／7-12 月
  const heatmapData = fillMonthlyDistanceFromFirstYear(stats?.monthlyDistance ?? []).map((d) => ({
    label: d.month,
    value: d.distanceKm,
  }));
  const countyData = (stats?.countyStats ?? []).slice(0, COUNTY_STATS_COUNT).map((d) => ({ label: d.county, value: d.count }));

  const trendData = fillMonthlyDistance(stats?.monthlyDistance ?? [], TREND_MONTHS_COUNT).map((d) => ({
    date: `${d.month}-01`,
    value: d.distanceKm,
  }));

  const weekdayData = getWeekdayCounts(hikes).map((d, i) => ({ label: t(`weekday.${WEEKDAY_KEYS[i]}`), value: d.count }));
  const distanceBucketData = getDistanceBucketCounts(hikes).map((d, i) => ({
    label: t(`distanceBucketLabel.${DISTANCE_BUCKET_KEYS[i]}`),
    value: d.count,
  }));

  const peakMonth = monthlyData.reduce((max, d) => (d.value > max.value ? d : max), monthlyData[0]);
  const topCounty = countyData[0];
  const peakWeekday = weekdayData.reduce((max, d) => (d.value > max.value ? d : max), weekdayData[0]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="bg-panel rounded-panel flex h-50 flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <span className="text-background-contrary/60 text-sm">{t('monthlyDistance')}</span>
            {peakMonth && peakMonth.value > 0 && (
              <span className="bg-accent text-accent-contrast rounded-full px-2 py-0.5 text-xs font-semibold">
                {t('peakMonth', { month: peakMonth.label, distance: peakMonth.value })}
              </span>
            )}
          </div>
          <ChartBar data={monthlyData} emptyLabel={tCommon('noData')} unit={t('unitKm')} xAxisUnit={t('unitMonth') || undefined} />
        </div>

        <div className="bg-panel rounded-panel flex h-50 flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <span className="text-background-contrary/60 text-sm">{t('countyStats')}</span>
            {topCounty && topCounty.value > 0 && (
              <span className="bg-accent text-accent-contrast rounded-full px-2 py-0.5 text-xs font-semibold">
                {t('topCounty', { county: topCounty.label, count: topCounty.value })}
              </span>
            )}
          </div>
          <ChartBar data={countyData} emptyLabel={tCommon('noData')} unit={t('unitCount')} />
        </div>

        <div className="bg-panel rounded-panel flex h-50 flex-col gap-4 p-4">
          <span className="text-background-contrary/60 text-sm">{t('distanceBucket')}</span>
          <ChartBar data={distanceBucketData} emptyLabel={tCommon('noData')} unit={t('unitCount')} xAxisUnit={t('unitKm')} />
        </div>

        <div className="bg-panel rounded-panel flex h-50 flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <span className="text-background-contrary/60 text-sm">{t('weekdayStats')}</span>
            {peakWeekday && peakWeekday.value > 0 && (
              <span className="bg-accent text-accent-contrast rounded-full px-2 py-0.5 text-xs font-semibold">
                {t('peakWeekday', { weekday: peakWeekday.label, count: peakWeekday.value })}
              </span>
            )}
          </div>
          <ChartBar data={weekdayData} emptyLabel={tCommon('noData')} unit={t('unitCount')} />
        </div>
      </div>

      {/* 卡片跟其他卡片同寬；左右內距縮小，讓線圖能更貼近卡片邊緣，不要留一大圈空白 */}
      <div className="bg-panel rounded-panel flex h-50 w-full flex-col gap-4 px-2 py-4">
        <span className="text-background-contrary/60 px-2 text-sm">{t('distanceTrend')}</span>
        <ChartLine data={trendData} emptyLabel={tCommon('noData')} unit={t('unitKm')} />
      </div>

      {/* 熱度圖是縱向多欄的形狀，跟其他橫長方形圖表比例不同，獨立佔一整排 */}
      <div className="bg-panel rounded-panel flex flex-col gap-4 p-4">
        <span className="text-background-contrary/60 text-sm">{t('monthlyHeatmap')}</span>
        <ChartHeatmap data={heatmapData} emptyLabel={tCommon('noData')} />
      </div>
    </div>
  );
}
