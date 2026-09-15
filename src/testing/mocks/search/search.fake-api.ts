import type { MatchReason, QuerySuggestion, SearchResult, SearchResultWithRelevance } from '../../../components/SearchBar/SearchBar.types';
import { MOCK_TRAIL_DETAILS, type TrailCategory } from '../trails/trails.data';
import { MOCK_POPULAR_QUERIES, MOCK_RESULTS } from './search.data';

export const RESULTS_PER_PAGE = 5;

function fieldsToSearch(item: SearchResult): string[] {
  return [item.displayName, item.county ?? '', item.town ?? '', item.note ?? ''];
}

function matchesName(item: SearchResult, q: string): boolean {
  return item.displayName.toLowerCase().includes(q);
}

function matchesOtherFields(item: SearchResult, q: string): boolean {
  return fieldsToSearch(item)
    .slice(1)
    .some((field) => field.toLowerCase().includes(q));
}

// 打字中即時提示：只給少量最相關的直接符合結果
// 之後要換成 autocomplete API：追求快、不追求準，回一小批輕量結果
export function getSuggestions(query: string, limit = 5): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return MOCK_RESULTS.filter((item) => matchesName(item, q)).slice(0, limit);
}

// 文字建議：從熱門關鍵字裡找開頭符合的字串，點下去等於直接送出這串文字去搜尋
// 之後可換成後端統計「最多人搜過的字串」，依熱門度排序回傳
export function getQuerySuggestions(query: string, limit = 3): QuerySuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return MOCK_POPULAR_QUERIES.filter((text) => text.toLowerCase().includes(q))
    .slice(0, limit)
    .map((text) => ({ type: 'query', text }));
}

// 送出後的完整搜尋結果：名稱符合 > 其他欄位符合，依此排序
// 之後要換成 search API：後端做全文檢索，前端只管顯示回傳結果
export function getFullSearchResults(query: string): SearchResultWithRelevance[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const byName = MOCK_RESULTS.filter((item) => matchesName(item, q));
  const byField = MOCK_RESULTS.filter((item) => !matchesName(item, q) && matchesOtherFields(item, q));

  const withReason = (items: SearchResult[], matchReason: MatchReason): SearchResultWithRelevance[] => items.map((item) => ({ ...item, matchReason }));

  return [...withReason(byName, 'name'), ...withReason(byField, 'field')];
}

export function paginate<T>(items: T[], page: number, perPage = RESULTS_PER_PAGE): T[] {
  const start = (page - 1) * perPage;
  return items.slice(start, start + perPage);
}

// 分類／縣市篩選：只精準比對官方路線的欄位，不做模糊字串搜尋
// 之後要換成 search API：後端依分類/縣市查詢，前端只管顯示回傳結果
export function getTrailsByFilter(category: TrailCategory | null, county: string | null): SearchResultWithRelevance[] {
  const trails = MOCK_TRAIL_DETAILS.filter((trail) => (!category || trail.categories.includes(category)) && (!county || trail.county === county));

  return trails.map((trail) => ({
    type: 'trail',
    slug: trail.slug,
    displayName: trail.name,
    county: trail.county,
    town: trail.town,
    note: trail.note,
    matchReason: 'field',
  }));
}
