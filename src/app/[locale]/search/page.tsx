import { getTranslations } from 'next-intl/server';

import PageLayout from '../../../components/PageLayout';
import TrailListItem from '../../../components/TrailListItem';
import { Link } from '../../../i18n/navigation';
import { filterTrails, search } from '../../../lib/db/search';
import { TRAIL_CATEGORIES, type TrailCategory } from '../../../testing/mocks/trails/trails.data';
import NearbyTrails from './_components/NearbyTrails';
import SearchBarWithNavigation from './_components/SearchBarWithNavigation';

type Props = {
  searchParams: Promise<{ q?: string; category?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const { q = '', category: rawCategory } = await searchParams;
  const category = TRAIL_CATEGORIES.includes(rawCategory as TrailCategory) ? (rawCategory as TrailCategory) : null;

  const t = await getTranslations('SearchPage');

  const isFiltering = Boolean(category);
  const results = q ? await search(q) : isFiltering ? await filterTrails(category, null) : [];

  return (
    <PageLayout>
      <SearchBarWithNavigation />

      {q && results.length === 0 && <p className="text-background-contrary/60 text-center text-sm">{t('noResults', { query: q })}</p>}
      {!q && isFiltering && results.length === 0 && <p className="text-background-contrary/60 text-center text-sm">{t('noTrails')}</p>}

      {(q || isFiltering) && results.length > 0 && (
        <div className="scrollbar-subtle flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
          {results.map((item) => (
            <TrailListItem
              key={`${item.type}-${item.slug}`}
              href={item.type === 'hike' ? `/hikes/${item.slug}` : `/trails/${item.slug}`}
              name={item.displayName}
              county={item.county ?? ''}
              town={item.town ?? ''}
            />
          ))}
        </div>
      )}

      {!q && !isFiltering && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-background-contrary/60 text-sm">{t('categoryFilter')}</span>
            <div className="grid grid-cols-3 gap-3">
              {TRAIL_CATEGORIES.map((item) => (
                <Link
                  key={item}
                  href={{ pathname: '/search', query: { category: item } }}
                  className="bg-panel hover:bg-panel-active text-background-contrary rounded-panel flex h-24 items-center justify-center px-4 text-center text-lg font-bold transition-colors"
                >
                  {t(item)}
                </Link>
              ))}
            </div>
          </div>

          <NearbyTrails />
        </div>
      )}
    </PageLayout>
  );
}
