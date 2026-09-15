'use client';

import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Popover } from 'radix-ui';
import { useEffect, useState } from 'react';

import { fetchPopularQueries, fetchSearchSuggestions, logSearchQuery } from '../../lib/db/search.actions';
import QuerySuggestionItem from './QuerySuggestionItem';
import styles from './SearchBar.module.css';
import type { QuerySuggestion, SearchResult } from './SearchBar.types';
import SearchResultItem from './SearchResultItem';

type Props = {
  onSubmitQuery: (query: string) => void;
  onSelectEntity: (item: SearchResult) => void;
};

const SUGGESTION_DEBOUNCE_MS = 250;
const SUGGESTION_LIMIT = 5;

export default function SearchBar({ onSubmitQuery, onSelectEntity }: Props) {
  const t = useTranslations('SearchBar');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [entitySuggestions, setEntitySuggestions] = useState<SearchResult[]>([]);
  const [popularQueries, setPopularQueries] = useState<string[]>([]);

  useEffect(() => {
    fetchPopularQueries()
      .then(setPopularQueries)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const q = query.trim();
    // 清空的工作交給下面的 visibleEntitySuggestions 用算的，
    // 在 effect 裡同步 setState 會多觸發一輪 render
    if (!q) return;

    const timer = setTimeout(async () => {
      const results = await fetchSearchSuggestions(q).catch(() => []);
      setEntitySuggestions(
        results
          .slice(0, SUGGESTION_LIMIT)
          .map((item) => ({ type: item.type, slug: item.slug, displayName: item.displayName, county: item.county ?? undefined, town: item.town ?? undefined }))
      );
    }, SUGGESTION_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  const q = query.trim().toLowerCase();
  const querySuggestions: QuerySuggestion[] = q
    ? popularQueries
        .filter((text) => text.toLowerCase().includes(q))
        .slice(0, 3)
        .map((text) => ({ type: 'query', text }))
    : [];
  // 輸入框清空時舊的建議就不該再出現，但那是「算得出來」的，不需要另外存一份 state
  const visibleEntitySuggestions = q ? entitySuggestions : [];
  const showSuggestions = open && (visibleEntitySuggestions.length > 0 || querySuggestions.length > 0);

  function submitQuery(q: string) {
    setOpen(false);
    const trimmed = q.trim();
    if (!trimmed) return;
    logSearchQuery(trimmed).catch(() => {});
    onSubmitQuery(trimmed);
  }

  function handleSelectEntity(item: SearchResult) {
    setOpen(false);
    onSelectEntity(item);
  }

  function handleSelectQuery(item: QuerySuggestion) {
    setQuery(item.text);
    submitQuery(item.text);
  }

  return (
    <Popover.Root open={showSuggestions}>
      <Popover.Anchor asChild>
        <div className="bg-panel flex items-center gap-2 rounded-full px-4 py-2">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitQuery(query);
            }}
            placeholder={t('placeholder')}
            className="text-background-contrary flex-1 bg-transparent outline-none lg:text-lg"
          />
          <button onClick={() => submitQuery(query)} aria-label={t('searchLabel')} className="cursor-pointer">
            <Search className="text-background-contrary h-5 w-5" />
          </button>
        </div>
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          onOpenAutoFocus={(e) => e.preventDefault()}
          sideOffset={8}
          className={`bg-panel w-(--radix-popover-trigger-width) ${styles.resultsPanel}`}
        >
          {querySuggestions.map((item) => (
            <QuerySuggestionItem key={`query-${item.text}`} item={item} onSelect={handleSelectQuery} />
          ))}
          {visibleEntitySuggestions.map((item) => (
            <SearchResultItem key={`${item.type}-${item.slug}`} item={{ ...item, matchReason: 'name' }} onSelect={handleSelectEntity} />
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
