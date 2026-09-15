'use client';

import { ArrowLeft, Pencil } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import TrailDetailCardBody from '../../../../../components/TrailDetailCardBody';
import TrailEditCard, { type EditableTrail } from '../../../../../components/TrailEditCard';
import { Link } from '../../../../../i18n/navigation';
import type { Hike } from '../../../../../lib/api/adapters/hikes';
import { apiClient } from '../../../../../lib/apiClient';
import { deleteHikeAction, updateHikeAction } from '../../../../../lib/db/hikes.actions';

type Props = {
  hike: Hike;
  mountainNames: string[];
};

export default function HikeDetailCard({ hike: initialHike, mountainNames: initialMountainNames }: Props) {
  const t = useTranslations('HikeDetailPage');
  const tEdit = useTranslations('TrailEditCard');
  const router = useRouter();

  const [hike, setHike] = useState(initialHike);
  const [mountainNames, setMountainNames] = useState(initialMountainNames);
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    const editableTrail: EditableTrail = {
      slug: String(hike.id),
      name: hike.name,
      county: hike.county ?? '',
      town: hike.town ?? '',
      date: hike.date,
      distanceKm: hike.distanceKm,
      isPublic: hike.isPublic,
      urls: hike.urls,
      note: hike.note ?? undefined,
      mountainIds: hike.mountainIds ?? [],
    };

    return (
      <TrailEditCard
        className="lg:min-h-full"
        trail={editableTrail}
        onClose={() => setIsEditing(false)}
        onSave={async (patch) => {
          const result = await updateHikeAction(hike.id, patch);
          if (!result.ok) throw new Error(result.error);
          // Server Action 只回傳成功與否，本地狀態直接套用剛送出的內容
          setHike((prev) => ({ ...prev, ...patch }));
          if (patch.mountainIds) {
            const mountains = await apiClient.mountains.findAll();
            setMountainNames(
              patch.mountainIds.map((id) => mountains.find((mountain) => mountain.id === id)?.name).filter((name): name is string => Boolean(name))
            );
          }
          setIsEditing(false);
        }}
        onDelete={async () => {
          const deleted = await deleteHikeAction(hike.id);
          if (!deleted.ok) throw new Error(deleted.error);
          router.push('/data');
        }}
      />
    );
  }

  return (
    <TrailDetailCardBody
      className="lg:min-h-full"
      name={hike.name}
      county={hike.county ?? ''}
      town={hike.town ?? ''}
      distanceKm={hike.distanceKm}
      distanceUnitLabel={t('distanceUnit')}
      date={hike.date}
      urls={hike.urls}
      linkLabel={(index) => t('linkLabel', { index: index + 1 })}
      mountainNames={mountainNames}
      note={hike.note ?? undefined}
      noteLabel={tEdit('note')}
      coverImageUrl={hike.coverImageUrl}
      isPublic={hike.isPublic}
      publicLabel={tEdit('public')}
      headerActions={
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/data"
            title={t('backToProfile')}
            className="border-background-contrary/30 hover:bg-panel-active flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            title={t('edit')}
            className="border-background-contrary/30 hover:bg-panel-active flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      }
    />
  );
}
