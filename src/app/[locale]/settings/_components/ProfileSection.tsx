'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { apiClient } from '../../../../lib/apiClient';

type Props = {
  avatar: string;
  description: string;
};

export default function ProfileSection({ avatar, description }: Props) {
  const t = useTranslations('EditProfileForm');
  const router = useRouter();
  const [avatarValue, setAvatarValue] = useState(avatar);
  const [descriptionValue, setDescriptionValue] = useState(description);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const isDirty = avatarValue !== avatar || descriptionValue !== description;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    try {
      await apiClient.profile.updateMe({ avatar: avatarValue, description: descriptionValue });
      setStatus('saved');
      router.refresh();
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-background-contrary/60 text-sm">{t('title')}</h2>

      <form onSubmit={handleSubmit} className="bg-panel rounded-panel flex flex-col gap-3 px-4 py-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm">{t('avatar')}</span>
          <input
            type="text"
            value={avatarValue}
            onChange={(e) => setAvatarValue(e.target.value)}
            className="border-background-contrary bg-panel text-background-contrary border-b px-1 py-1.5 outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">{t('description')}</span>
          <textarea
            value={descriptionValue}
            onChange={(e) => setDescriptionValue(e.target.value)}
            rows={2}
            className="border-background-contrary bg-panel text-background-contrary border-b px-1 py-1.5 outline-none"
          />
        </label>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={status === 'saving' || !isDirty}
            className="bg-panel-active hover:bg-panel-active-lighten rounded-panel w-fit px-3 py-1.5 text-sm transition-colors disabled:opacity-50"
          >
            {t('save')}
          </button>
          {status === 'saved' && <span className="text-background-contrary/60 text-xs">{t('saved')}</span>}
          {status === 'error' && <span className="text-xs text-red-500">{t('saveFailed')}</span>}
        </div>
      </form>
    </div>
  );
}
