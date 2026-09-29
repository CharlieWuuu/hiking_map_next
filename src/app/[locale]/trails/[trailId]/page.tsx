import { ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import TrailLayer from '../../../../components/MapView/TrailLayer';
import PageLayout from '../../../../components/PageLayout';
import TrailDetailCardBody from '../../../../components/TrailDetailCardBody';
import { Link } from '../../../../i18n/navigation';
import { findTrailBySlug } from '../../../../lib/db/trails';
import { toSegments } from '../../../../lib/geojsonSegments';

export default async function TrailDetailPage({ params }: { params: Promise<{ trailId: string }> }) {
  const { trailId } = await params;
  const trail = await findTrailBySlug(trailId);

  if (!trail) notFound();

  const t = await getTranslations('TrailDetailPage');
  const path = toSegments(trail.geojson);

  return (
    <PageLayout>
      <div className="page-wide flex h-full min-h-0 w-full flex-col gap-4 lg:flex-row">
        <div className="scrollbar-subtle min-h-0 w-full shrink-0 overflow-y-auto lg:h-full lg:max-w-md">
          <TrailDetailCardBody
            className="lg:min-h-full"
            name={trail.name}
            county={trail.county ?? ''}
            town={trail.town ?? ''}
            distanceKm={trail.distanceKm ?? undefined}
            distanceUnitLabel={t('distanceUnit')}
            urls={[]}
            linkLabel={(index) => t('linkLabel', { index: index + 1 })}
            categoryNames={trail.categoryNames}
            note={trail.description ?? undefined}
            noteLabel={t('intro')}
            coverImageUrl={trail.coverImageUrl}
            headerActions={
              <Link
                href="/search"
                title={t('back')}
                className="border-background-contrary/30 hover:bg-panel-active flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
            }
          />
        </div>

        <TrailLayer path={path} className="rounded-panel h-100 w-full flex-1 overflow-hidden lg:h-full" />
      </div>
    </PageLayout>
  );
}
