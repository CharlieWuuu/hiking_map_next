'use client';

import { useEffect, useMemo, useState } from 'react';

import type { Mountain } from '../../lib/api/adapters/mountains';
import { apiClient } from '../../lib/apiClient';
import TagBadge from '../TagBadge';
import { inputClassName } from './fieldStyles';

type Props = {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  searchPlaceholder: string;
};

export default function MountainMultiSelect({ selectedIds, onChange, searchPlaceholder }: Props) {
  const [mountains, setMountains] = useState<Mountain[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    apiClient.mountains
      .findAll()
      .then(setMountains)
      .catch(() => {});
  }, []);

  const selectedMountains = useMemo(() => mountains.filter((mountain) => selectedIds.includes(mountain.id)), [mountains, selectedIds]);

  const q = query.trim().toLowerCase();
  const suggestions = q ? mountains.filter((mountain) => !selectedIds.includes(mountain.id) && mountain.name.toLowerCase().includes(q)).slice(0, 8) : [];

  function toggle(id: number) {
    onChange(selectedIds.includes(id) ? selectedIds.filter((existing) => existing !== id) : [...selectedIds, id]);
  }

  return (
    <div className="flex w-full flex-col items-start gap-2">
      <div className="relative w-full">
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={searchPlaceholder} className={inputClassName} />
        {suggestions.length > 0 && (
          <div className="bg-panel-active rounded-panel absolute top-full left-0 z-10 mt-1 flex w-full flex-col overflow-hidden">
            {suggestions.map((mountain) => (
              <button
                key={mountain.id}
                type="button"
                onClick={() => {
                  toggle(mountain.id);
                  setQuery('');
                }}
                className="hover:bg-panel-active-lighten flex items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors duration-150"
              >
                <span>{mountain.name}</span>
                {mountain.categories.length > 0 && <span className="text-background-contrary/50 shrink-0 text-xs">{mountain.categories.join('・')}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedMountains.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedMountains.map((mountain) => (
            <TagBadge
              key={mountain.id}
              label={mountain.categories.length > 0 ? `${mountain.name}・${mountain.categories.join('・')}` : mountain.name}
              tone="accent"
              removable
              onClick={() => toggle(mountain.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
