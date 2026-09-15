import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

import TrailEditCard, { type EditableTrail } from '../../../../components/TrailEditCard';
import TrailListItem from '../../../../components/TrailListItem';
import TrailTable from '../../../../components/TrailTable';
import type { Mountain } from '../../../../lib/api';
import TrailDetailExpanded from './TrailDetailExpanded';

type Trail = EditableTrail & { path: [number, number][]; bbox?: [number, number, number, number] | null; categoryNames?: string[] };

type Props = {
  trails: Trail[];
  view: 'card' | 'table';
  activeSlug: string | null;
  isEditMode: boolean;
  mountains: Mountain[];
  onHoverChange: (slug: string | null) => void;
  onSelect: (slug: string | null, bbox?: [number, number, number, number] | null) => void;
  onSaveTrailPatch: (slug: string, patch: Partial<EditableTrail>) => void | Promise<void>;
  onDeleteTrail: (slug: string) => void;
};

export default function TrailExplorerList({
  trails,
  view,
  activeSlug,
  isEditMode,
  mountains,
  onHoverChange,
  onSelect,
  onSaveTrailPatch,
  onDeleteTrail,
}: Props) {
  const t = useTranslations('ProfileDataPage');
  const activeRef = useRef<HTMLDivElement & HTMLButtonElement>(null);

  // 跳頁後（例如地圖點路線）選中項目可能一開始不在可視範圍內，捲過去讓使用者看得到
  useEffect(() => {
    if (activeSlug) activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeSlug, trails]);

  if (trails.length === 0) {
    return <p className="text-background-contrary/60 text-sm">{t('noTrails')}</p>;
  }

  if (view === 'table') {
    return (
      <TrailTable
        trails={trails}
        activeSlug={activeSlug}
        onMouseEnter={onHoverChange}
        onMouseLeave={() => onHoverChange(null)}
        onSelect={(slug) => {
          const trail = trails.find((item) => item.slug === slug);
          onSelect(activeSlug === slug ? null : slug, trail?.bbox);
        }}
        renderEditRow={
          isEditMode
            ? (slug) => {
                const trail = trails.find((item) => item.slug === slug);
                if (!trail) return null;
                return (
                  <TrailEditCard
                    trail={trail}
                    onClose={() => onSelect(null)}
                    onSave={(patch) => onSaveTrailPatch(trail.slug, patch)}
                    onDelete={() => onDeleteTrail(trail.slug)}
                  />
                );
              }
            : undefined
        }
      />
    );
  }

  return (
    <>
      {trails.map((trail) =>
        isEditMode && trail.slug === activeSlug ? (
          <div key={trail.slug} ref={activeRef}>
            <TrailEditCard
              trail={trail}
              onClose={() => onSelect(null)}
              onSave={(patch) => onSaveTrailPatch(trail.slug, patch)}
              onDelete={() => onDeleteTrail(trail.slug)}
            />
          </div>
        ) : trail.slug === activeSlug ? (
          <button
            key={trail.slug}
            ref={activeRef}
            type="button"
            onMouseEnter={() => onHoverChange(trail.slug)}
            onMouseLeave={() => onHoverChange(null)}
            onClick={() => onSelect(null)}
            className="rounded-panel outline-accent w-full cursor-pointer text-left outline-2 -outline-offset-2"
          >
            <TrailDetailExpanded
              trail={trail}
              mountainNames={trail.mountainIds
                .map((id) => mountains.find((mountain) => mountain.id === id)?.name)
                .filter((name): name is string => Boolean(name))}
            />
          </button>
        ) : (
          <TrailListItem
            key={trail.slug}
            name={trail.name}
            county={trail.county}
            town={trail.town}
            date={trail.date}
            distanceKm={trail.distanceKm}
            isPublic={trail.isPublic}
            isActive={false}
            badges={trail.categoryNames?.map((categoryName) => ({ label: categoryName, tone: 'neutral' as const }))}
            onMouseEnter={() => onHoverChange(trail.slug)}
            onMouseLeave={() => onHoverChange(null)}
            onClick={() => onSelect(trail.slug, trail.bbox)}
          />
        )
      )}
    </>
  );
}
