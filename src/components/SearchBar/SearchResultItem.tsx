import { useTranslations } from 'next-intl';

import type { SearchResultWithRelevance } from './SearchBar.types';

type Props = {
  item: SearchResultWithRelevance;
  onSelect: (item: SearchResultWithRelevance) => void;
};

export default function SearchResultItem({ item, onSelect }: Props) {
  const t = useTranslations('SearchResult');

  return (
    <button
      onClick={() => onSelect(item)}
      className="hover:bg-panel-active-lighten/50 text-background-contrary rounded-panel flex w-full cursor-pointer items-center gap-3 px-3.5 py-2 text-left transition-colors duration-150"
    >
      <span className="flex flex-col items-start">
        <span className="font-bold">{item.displayName}</span>
        <span className="text-background-contrary/60 text-xs">
          {item.type === 'hike' ? t('hike') : t('trail')}
          {item.matchReason === 'field' && t('matchField')}
        </span>
      </span>
    </button>
  );
}
