'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import type { MountainProgress as MountainProgressData } from '../../lib/api/adapters/hikes';

type Props = {
  progress: MountainProgressData;
};

function CategorySection({ label, completed, missing }: { label: string; completed: { id: number; name: string }[]; missing: { id: number; name: string }[] }) {
  const t = useTranslations('MountainProgress');
  const [expanded, setExpanded] = useState(false);
  const total = completed.length + missing.length;

  return (
    <div className="flex flex-col gap-2">
      <button type="button" onClick={() => setExpanded((prev) => !prev)} className="flex w-full items-center justify-between text-left">
        <span className="font-bold">{label}</span>
        <span className="text-background-contrary/60 text-sm">{t('progressCount', { completed: completed.length, total })}</span>
      </button>
      {expanded && (
        <div className="flex flex-col gap-3 text-sm">
          {missing.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-background-contrary/60">{t('missing')}</span>
              <div className="flex flex-wrap gap-1.5">
                {missing.map((mountain) => (
                  <span key={mountain.id} className="bg-panel-active rounded-full px-2.5 py-0.5">
                    {mountain.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {completed.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-background-contrary/60">{t('completed')}</span>
              <div className="flex flex-wrap gap-1.5">
                {completed.map((mountain) => (
                  <span key={mountain.id} className="bg-accent text-background rounded-full px-2.5 py-0.5">
                    {mountain.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MountainProgress({ progress }: Props) {
  const t = useTranslations('MountainProgress');

  return (
    <div className="bg-panel rounded-panel flex flex-col gap-4 p-4">
      <span className="text-background-contrary/60 text-sm">{t('title')}</span>
      <CategorySection label={t('hundred')} completed={progress.hundred.completed} missing={progress.hundred.missing} />
      <CategorySection label={t('smallHundred')} completed={progress.smallHundred.completed} missing={progress.smallHundred.missing} />
    </div>
  );
}
