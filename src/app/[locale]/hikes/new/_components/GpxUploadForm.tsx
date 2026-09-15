'use client';

import { Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

import TrailLayer from '../../../../../components/MapView/TrailLayer';
import TrailEditCard, { type EditableTrail } from '../../../../../components/TrailEditCard';
import { useRouter } from '../../../../../i18n/navigation';
import { createHikeAction } from '../../../../../lib/db/hikes.actions';
import { GpxParseError, parseGpx, toFeatureCollection, type ParsedGpx, type TrackPoint } from '../../../../../lib/gpx/parseGpx';

function getBbox(points: TrackPoint[]): [number, number, number, number] {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const point of points) {
    const [lng, lat] = point.position;
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  }

  return [minLng, minLat, maxLng, maxLat];
}

export default function GpxUploadForm() {
  const t = useTranslations('HikeUploadPage');
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parsed, setParsed] = useState<ParsedGpx | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    try {
      setParsed(parseGpx(await file.text()));
      setFileName(file.name);
    } catch (caught) {
      setParsed(null);
      setFileName(null);
      setError(caught instanceof GpxParseError ? caught.message : t('parseFailed'));
    }
  }

  if (!parsed) {
    return (
      <div className="flex w-full flex-1 items-center justify-center">
        <div className="flex h-150 w-full flex-col gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="border-background-contrary/30 hover:bg-panel flex w-full flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 transition-colors"
          >
            <Upload className="text-background-contrary/60 h-6 w-6" />
            <span className="text-sm">{fileName ?? t('choosePrompt')}</span>
            <span className="text-background-contrary/60 text-xs">{t('chooseHint')}</span>
          </button>
          <input ref={fileInputRef} type="file" accept=".gpx,application/gpx+xml" onChange={handleFileChange} className="hidden" />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      </div>
    );
  }

  // 全段合併算 bbox，讓地圖初始就置中整條路線
  const bbox = getBbox(parsed.segments.flat());

  const editableTrail: EditableTrail = {
    slug: 'new',
    name: parsed.name ?? (fileName ?? '').replace(/\.gpx$/i, ''),
    county: '',
    town: '',
    date: parsed.date ?? new Date().toISOString().slice(0, 10),
    distanceKm: Number(parsed.distanceKm.toFixed(2)),
    isPublic: true,
    urls: [],
    note: undefined,
    mountainIds: [],
  };

  async function handleSave(patch: Partial<EditableTrail>) {
    const trail = { ...editableTrail, ...patch };
    // 距離不送——一律由 PostGIS 從軌跡算，前端算的只用於上傳前的預覽
    const collection = toFeatureCollection(parsed!);
    const geometry = collection.features[0]?.geometry;
    if (!geometry) throw new Error('GPX 中沒有可用的軌跡');

    const result = await createHikeAction({
      name: trail.name,
      county: trail.county || undefined,
      town: trail.town || undefined,
      date: trail.date,
      isPublic: trail.isPublic,
      note: trail.note || undefined,
      urls: trail.urls.filter((url) => url.trim() !== ''),
      mountainIds: trail.mountainIds,
      geometry,
    });
    if (!result.ok) throw new Error(result.error);
    router.push(`/hikes/${result.id}`);
  }

  return (
    <div className="page-wide flex h-full min-h-0 w-full flex-col gap-4 lg:flex-row">
      <div className="scrollbar-subtle h-full min-h-0 w-full overflow-y-auto lg:max-w-md lg:shrink-0">
        <TrailEditCard trail={editableTrail} onClose={() => router.push('/data')} onSave={handleSave} className="min-h-full" />
      </div>

      <TrailLayer
        path={parsed.segments[0].map((point) => point.position)}
        bbox={bbox}
        className="rounded-panel h-100 w-full flex-1 overflow-hidden lg:h-full"
      />
    </div>
  );
}
