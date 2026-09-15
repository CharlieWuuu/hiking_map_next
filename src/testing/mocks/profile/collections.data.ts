import type { SearchResultWithRelevance } from '../../../components/SearchBar/SearchBar.types';
import { MOCK_RESULTS } from '../search/search.data';

// 之後接上真的後端 API 後，這份假資料會換成打「使用者收藏清單」API 查詢的結果
export const MOCK_COLLECTIONS: Record<string, SearchResultWithRelevance[]> = {
  demo: MOCK_RESULTS.filter((item) => item.type === 'trail')
    .slice(0, 4)
    .map((item) => ({ ...item, matchReason: 'name' })),
};
