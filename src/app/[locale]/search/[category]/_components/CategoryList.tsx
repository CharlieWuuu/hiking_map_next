'use client';

import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { Link } from '../../../../../i18n/navigation';
import MountainMap from './MountainMap';

export type CategoryItem = {
  id: number | string;
  name: string;
  county: string | null;
  elevationM?: number;
  distanceKm?: number | null;
  range?: string | null;
  completed?: boolean;
  href?: string;
  lat?: number | null;
  lng?: number | null;
};

type Filter = 'all' | 'completed' | 'notYet';

export default function CategoryList({ items }: { items: CategoryItem[] }) {
  const t = useTranslations('CategoryPage');
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const selectedRef = useRef<HTMLDivElement>(null);

  // 山頭顯示海拔（名單依海拔排序），步道顯示距離（依距離排序）——
  // 右側數字跟排序依據一致，掃過清單時順序才讀得出來。
  // 清單右欄與地圖浮層共用這一份，兩邊不會各寫一份而走鐘
  function metaOf(item: CategoryItem) {
    if (item.elevationM) return `${item.elevationM.toLocaleString()} ${t('elevationUnit')}`;
    if (item.distanceKm != null) return `${item.distanceKm} ${t('distanceUnit')}`;
    return item.county ?? '';
  }

  // completed 只有帶進度的名單才有；沒有的話不顯示進度與篩選
  const hasProgress = items.some((item) => item.completed !== undefined);
  const completedCount = items.filter((item) => item.completed).length;

  const visible = !hasProgress || filter === 'all' ? items : items.filter((item) => (filter === 'completed' ? item.completed : !item.completed));

  // 從地圖點選時，清單捲到對應項目——否則選中的可能在畫面外
  useEffect(() => {
    if (selectedId !== null) selectedRef.current?.scrollIntoView({ block: 'nearest' });
  }, [selectedId]);

  // 地圖跟著篩選走：切到「已完成」時只剩那幾個點，才看得出分布；
  // 100 個點全開時已完成的那幾個會被蓋住
  const mapped = visible
    .filter((item) => item.lat != null && item.lng != null)
    .map((item) => ({
      id: item.id,
      name: item.name,
      lat: item.lat as number,
      lng: item.lng as number,
      completed: item.completed,
      meta: metaOf(item),
    }));

  if (items.length === 0) {
    return <p className="text-background-contrary/60 text-sm">{t('empty')}</p>;
  }

  return (
    // 寬螢幕左右並排、各自佔滿高度；窄螢幕上下堆疊，地圖給固定高度免得被壓扁
    <div className="page-wide flex min-h-150 flex-1 flex-col gap-4 lg:h-full lg:min-h-0 lg:flex-row">
      <div className="flex min-h-0 w-full flex-col gap-3 lg:h-full lg:max-w-2xl lg:shrink-0">
        {hasProgress && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-background-contrary/60 text-sm">{t('progress', { completed: completedCount, total: items.length })}</span>
            <div className="flex gap-1">
              {(['all', 'completed', 'notYet'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={`rounded-panel px-3 py-1 text-sm transition-colors ${
                    filter === key ? 'bg-accent text-accent-contrast' : 'bg-panel hover:bg-panel-active text-background-contrary'
                  }`}
                >
                  {t(key === 'all' ? 'filterAll' : key === 'completed' ? 'filterCompleted' : 'filterNotYet')}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="scrollbar-subtle grid min-h-0 flex-1 auto-rows-min grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
          {visible.map((item) => {
            const isSelected = item.id === selectedId;
            const content = (
              <>
                <span className="flex min-w-0 items-center gap-2">
                  {item.completed && <Check className="text-accent h-4 w-4 shrink-0" aria-label={t('completed')} />}
                  <span className="truncate font-bold">{item.name}</span>
                </span>
                <span className="text-background-contrary/60 shrink-0 text-sm">{metaOf(item)}</span>
              </>
            );
            const className = `bg-panel rounded-panel flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors ${
              hasProgress && !item.completed ? 'opacity-50' : ''
            } ${isSelected ? 'outline-accent outline-2 -outline-offset-2' : 'hover:bg-panel-active'}`;

            return (
              <div key={item.id} ref={isSelected ? selectedRef : undefined} className="contents">
                {item.href ? (
                  // 第一次點只選取，讓地圖先飛過去看位置；已經選中的再點一次才進詳細頁。
                  // 直接連出去的話，使用者根本來不及在地圖上看到這條路線在哪
                  <Link
                    href={item.href}
                    className={className}
                    onClick={(event) => {
                      if (isSelected) return;
                      event.preventDefault();
                      setSelectedId(item.id);
                    }}
                  >
                    {content}
                  </Link>
                ) : (
                  <button type="button" className={className} onClick={() => setSelectedId(isSelected ? null : item.id)}>
                    {content}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {mapped.length > 0 && (
        <div className="h-100 w-full shrink-0 lg:h-full lg:min-w-0 lg:flex-1">
          <MountainMap items={mapped} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
      )}
    </div>
  );
}
