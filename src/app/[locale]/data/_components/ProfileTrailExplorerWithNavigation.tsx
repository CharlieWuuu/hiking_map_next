'use client';

import type { MapTrail } from '../../../../components/MapView/TrailsLayer';
import type { EditableTrail } from '../../../../components/TrailEditCard';
import { useRouter } from '../../../../i18n/navigation';
import ProfileTrailExplorer from './ProfileTrailExplorer';

type Trail = EditableTrail & Pick<MapTrail, 'path' | 'trackUrl' | 'bbox'> & { categoryNames?: string[] };

type Props = {
  trails: Trail[];
  totalCount: number;
  initialNextCursor: string | null;
  userId: string;
  category?: string;
  fullscreen: 'map' | 'table' | null;
  isEditMode: boolean;
  isOwner: boolean;
  initialViewport: { center: [number, number]; zoom: number } | null;
};

export default function ProfileTrailExplorerWithNavigation({
  trails,
  totalCount,
  initialNextCursor,
  userId,
  category,
  fullscreen,
  isEditMode,
  isOwner,
  initialViewport,
}: Props) {
  const router = useRouter();

  function handleFullscreenChange(next: 'map' | 'table' | null) {
    router.replace({ pathname: `/data`, query: next ? { fullscreen: next } : undefined });
  }

  function handleToggleEditMode() {
    router.replace({ pathname: `/data`, query: isEditMode ? undefined : { edit: 'true' } });
  }

  return (
    <ProfileTrailExplorer
      trails={trails}
      totalCount={totalCount}
      initialNextCursor={initialNextCursor}
      userId={userId}
      category={category}
      fullscreen={fullscreen}
      isEditMode={isEditMode}
      isOwner={isOwner}
      onFullscreenChange={handleFullscreenChange}
      onToggleEditMode={handleToggleEditMode}
      initialViewport={initialViewport}
    />
  );
}
