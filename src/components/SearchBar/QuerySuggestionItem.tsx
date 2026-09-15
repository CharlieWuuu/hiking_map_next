import { Search } from 'lucide-react';

import type { QuerySuggestion } from './SearchBar.types';

type Props = {
  item: QuerySuggestion;
  onSelect: (item: QuerySuggestion) => void;
};

export default function QuerySuggestionItem({ item, onSelect }: Props) {
  return (
    <button
      onClick={() => onSelect(item)}
      className="hover:bg-panel-active-lighten/50 text-background-contrary rounded-panel flex w-full cursor-pointer items-center gap-2 px-3.5 py-2 text-left transition-colors duration-150"
    >
      <Search className="text-background-contrary/60 h-4 w-4 shrink-0" />
      <span>{item.text}</span>
    </button>
  );
}
