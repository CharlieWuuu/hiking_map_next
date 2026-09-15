import { notFound, redirect } from 'next/navigation';

import TrailLayer from '../../../../components/MapView/TrailLayer';
import PageLayout from '../../../../components/PageLayout';
import { apiClient } from '../../../../lib/apiClient';
import { findHikeById } from '../../../../lib/db/hikes';
import { getCurrentUser } from '../../../../lib/getCurrentUser';
import HikeDetailCard from './_components/HikeDetailCard';

// 後端 hike_tracks.geom 是 MultiLineString，這裡只取第一條線來畫圖
function getHikePath(geojson: object | null | undefined): [number, number][] {
  if (!geojson || !('type' in geojson) || !('coordinates' in geojson)) return [];
  if (geojson.type === 'LineString') return geojson.coordinates as [number, number][];
  if (geojson.type === 'MultiLineString') return (geojson.coordinates as [number, number][][])[0] ?? [];
  return [];
}

export default async function HikeDetailPage({ params }: { params: Promise<{ hikeId: string }> }) {
  const { hikeId } = await params;
  const id = Number(hikeId);
  if (!Number.isInteger(id)) notFound();

  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login');

  const [hike, mountains] = await Promise.all([findHikeById(Number(id)), apiClient.mountains.findAll().catch(() => [])]);
  if (!hike || hike.userId !== currentUser.userId) notFound();

  const path = getHikePath(hike.geojson);
  const mountainNames = (hike.mountainIds ?? [])
    .map((mountainId) => mountains.find((mountain) => mountain.id === mountainId)?.name)
    .filter((name): name is string => Boolean(name));

  return (
    <PageLayout>
      <div className="page-wide flex h-full min-h-0 w-full flex-col gap-4 lg:flex-row">
        <div className="scrollbar-subtle min-h-0 w-full shrink-0 overflow-y-auto lg:h-full lg:max-w-md">
          <HikeDetailCard hike={hike} mountainNames={mountainNames} />
        </div>

        <TrailLayer path={path} bbox={hike.bbox} center={hike.center} className="rounded-panel h-100 w-full flex-1 overflow-hidden lg:h-full" />
      </div>
    </PageLayout>
  );
}
