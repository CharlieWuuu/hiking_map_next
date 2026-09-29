import { notFound, redirect } from 'next/navigation';

import TrailLayer from '../../../../components/MapView/TrailLayer';
import PageLayout from '../../../../components/PageLayout';
import { findHikeById } from '../../../../lib/db/hikes';
import { toSegments } from '../../../../lib/geojsonSegments';
import { getCurrentUser } from '../../../../lib/getCurrentUser';
import HikeDetailCard from './_components/HikeDetailCard';

export default async function HikeDetailPage({ params }: { params: Promise<{ hikeId: string }> }) {
  const { hikeId } = await params;
  const id = Number(hikeId);
  if (!Number.isInteger(id)) notFound();

  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login');

  const hike = await findHikeById(id);
  if (!hike || hike.userId !== currentUser.userId) notFound();

  const path = toSegments(hike.geojson);

  return (
    <PageLayout>
      <div className="page-wide flex h-full min-h-0 w-full flex-col gap-4 lg:flex-row">
        <div className="scrollbar-subtle min-h-0 w-full shrink-0 overflow-y-auto lg:h-full lg:max-w-md">
          <HikeDetailCard hike={hike} />
        </div>

        <TrailLayer path={path} bbox={hike.bbox} center={hike.center} className="rounded-panel h-100 w-full flex-1 overflow-hidden lg:h-full" />
      </div>
    </PageLayout>
  );
}
