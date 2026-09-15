import type { SearchResultDto as RawSearchResultDto } from '../generated/data-contracts';
import type { Search as SearchClient } from '../generated/Search';
import { toCamelCase } from './case';

export type SearchResult = {
  type: 'trail' | 'hike';
  slug: string;
  displayName: string;
  county?: string | null;
  town?: string | null;
  coverImageUrl?: string | null;
  matchReason: 'name' | 'field';
  distanceKm?: number;
  categoryName?: string;
};

export function adaptSearchResult(raw: RawSearchResultDto): SearchResult {
  return toCamelCase<RawSearchResultDto>(raw) as SearchResult;
}

export function createSearchService(client: SearchClient) {
  return {
    search: async (q: string) => (await client.searchControllerSearch({ q, category: '', county: '' })).map(adaptSearchResult),
    filterTrails: async (category: string | null, county: string | null) =>
      (await client.searchControllerSearch({ q: '', category: category ?? '', county: county ?? '' })).map(adaptSearchResult),
    nearby: async (lat: number, lng: number) => (await client.searchControllerNearby({ lat: String(lat), lng: String(lng) })).map(adaptSearchResult),
    lastLocation: () => client.searchControllerLastLocation(),
    popularQueries: async () => (await client.searchControllerPopularQueries()).map((item) => item.text),
    logQuery: (query: string) => client.searchControllerLogQuery({ query }),
  };
}
