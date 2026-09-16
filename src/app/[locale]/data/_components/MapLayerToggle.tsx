'use client';

import { useTranslations } from 'next-intl';

export type LayerKey = 'hundred' | 'smallHundred' | 'hundredTrail';

const LAYER_KEYS: LayerKey[] = ['hundred', 'smallHundred', 'hundredTrail'];

type Props = {
  visible: Record<LayerKey, boolean>;
  counts: Record<LayerKey, { completed: number; total: number }> | null;
  isLoading: boolean;
  onToggle: (key: LayerKey) => void;
};

// 疊在地圖左下角的圖層開關。三個官方名單各自獨立開關，
// 想一次看完就全開，想專心看一類就只留一個
export default function MapLayerToggle({ visible, counts, isLoading, onToggle }: Props) {
  const t = useTranslations('SearchPage');
  const tMap = useTranslations('MapLayerToggle');

  return (
    <div className="bg-panel/90 rounded-panel flex flex-col gap-1 p-2 backdrop-blur-sm">
      {LAYER_KEYS.map((key) => {
        const count = counts?.[key];
        return (
          <button
            key={key}
            type="button"
            onClick={() => onToggle(key)}
            className={`hover:bg-panel-active flex items-center gap-2 rounded px-2 py-1 text-left text-xs transition-colors ${
              visible[key] ? 'text-background-contrary' : 'text-background-contrary/40'
            }`}
          >
            {/* 用實心/空心方塊表示開關，跟地圖上的疊圖同色系 */}
            <span
              aria-hidden
              className="h-3 w-3 shrink-0 rounded-sm border"
              style={{ borderColor: '#7FD4FF', backgroundColor: visible[key] ? '#7FD4FF' : 'transparent' }}
            />
            <span className="whitespace-nowrap">{t(key)}</span>
            <span className="text-background-contrary/50 ml-auto whitespace-nowrap tabular-nums">
              {isLoading ? tMap('loading') : count ? `${count.completed}/${count.total}` : ''}
            </span>
          </button>
        );
      })}
    </div>
  );
}
