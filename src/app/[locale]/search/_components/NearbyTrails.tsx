'use client';

import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

import TrailListItem from '../../../../components/TrailListItem';
import { useNearbyTrails } from '../../../../lib/queries';

export default function NearbyTrails() {
  const t = useTranslations('SearchPage');
  // 定位與查詢都由 SWR 快取：回到探索頁直接顯示上次的結果，不必再等定位
  const { data: results, error, isValidating, mutate } = useNearbyTrails();
  // 按重試後重抓期間顯示載入中，而不是停在失敗畫面
  const status = results ? 'ready' : error && !isValidating ? 'failed' : 'loading';
  const onRetry = () => void mutate();

  return (
    <div className="flex flex-col gap-2">
      <span className="text-background-contrary/60 text-sm">{t('nearbyTitle')}</span>

      {status === 'loading' && (
        <div className="flex items-center justify-center py-6">
          <LoaderCircle className="text-background-contrary/40 h-8 w-8 animate-spin" />
        </div>
      )}

      {status === 'failed' && (
        <div className="bg-panel rounded-panel flex flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-background-contrary/60 text-sm">{t('nearbyLoadFailed')}</p>
          <button
            type="button"
            onClick={onRetry}
            className="bg-panel-active hover:bg-panel-active-lighten rounded-panel w-fit px-4 py-2 text-sm transition-colors"
          >
            {t('nearbyRetry')}
          </button>
        </div>
      )}

      {results && results.length === 0 && <p className="text-background-contrary/60 py-6 text-center text-sm">{t('nearbyEmpty')}</p>}

      {results && results.length > 0 && (
        <div className="flex flex-col gap-3">
          {results.map((item) => (
            <TrailListItem
              key={`${item.type}-${item.slug}`}
              href={item.type === 'hike' ? `/hikes/${item.slug}` : `/trails/${item.slug}`}
              name={item.displayName}
              county={item.county ?? ''}
              town={item.town ?? ''}
              badges={item.categoryName ? [{ label: item.categoryName, tone: 'neutral' }] : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
