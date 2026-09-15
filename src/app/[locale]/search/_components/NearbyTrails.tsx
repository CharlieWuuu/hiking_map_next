'use client';

import { LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import TrailListItem from '../../../../components/TrailListItem';
import type { SearchResult } from '../../../../lib/db/search';
import { fetchLastLocation, fetchNearbyTrails } from '../actions';

const TAIPEI_FALLBACK = { lat: 25.033, lng: 121.5654 };

export default function NearbyTrails() {
  const [retryToken, setRetryToken] = useState(0);
  // key 改變讓元件重新掛載，狀態自然回到初始值，不用在 effect 裡對已掛載元件同步 setState('loading')
  return <NearbyTrailsContent key={retryToken} onRetry={() => setRetryToken((token) => token + 1)} />;
}

function NearbyTrailsContent({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations('SearchPage');
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    let cancelled = false;

    const coords = new Promise<{ lat: number; lng: number }>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition((position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }), reject)
    ).catch(() =>
      // 定位失敗時先試使用者最新一筆紀錄的位置，未登入或沒有紀錄則退回台北
      fetchLastLocation()
        .catch(() => null)
        .then((lastLocation) => lastLocation ?? TAIPEI_FALLBACK)
    );

    coords
      .then(({ lat, lng }) => fetchNearbyTrails(lat, lng))
      .then((nearby) => {
        if (cancelled) return;
        setResults(nearby);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('failed');
      });

    return () => {
      cancelled = true;
    };
  }, []);

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

      {status === 'ready' && results.length === 0 && <p className="text-background-contrary/60 py-6 text-center text-sm">{t('nearbyEmpty')}</p>}

      {status === 'ready' && results.length > 0 && (
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
