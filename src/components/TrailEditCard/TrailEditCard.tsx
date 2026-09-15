'use client';

import { Plus, Save, Trash2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import TagBadge from '../TagBadge';
import { FieldRow, iconButtonClassName, inputClassName, textareaClassName } from './fieldStyles';
import MountainMultiSelect from './MountainMultiSelect';

export type EditableTrail = {
  slug: string;
  name: string;
  county: string;
  town: string;
  date: string;
  distanceKm: number;
  isPublic: boolean;
  urls: string[];
  note?: string;
  mountainIds: number[];
};

type Props = {
  trail: EditableTrail;
  onClose: () => void;
  onSave: (patch: Partial<EditableTrail>) => void | Promise<void>;
  // 新增流程還沒有紀錄可以刪，不傳就不顯示刪除按鈕
  onDelete?: () => void;
  className?: string;
};

const saveButtonClassName =
  'bg-accent text-background hover:bg-accent-darken flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-150 cursor-pointer';
const deleteButtonClassName =
  'bg-panel-active text-red-500 hover:bg-red-500 hover:text-background flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50';

export default function TrailEditCard({ trail, onClose, onSave, onDelete, className }: Props) {
  const t = useTranslations('TrailEditCard');
  const [patch, setPatch] = useState<Partial<EditableTrail>>({});
  const [urls, setUrls] = useState(trail.urls);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  function updateField<K extends keyof EditableTrail>(field: K, value: EditableTrail[K]) {
    setPatch((prev) => ({ ...prev, [field]: value }));
  }

  function updateUrl(index: number, value: string) {
    const next = urls.map((url, i) => (i === index ? value : url));
    setUrls(next);
    updateField('urls', next);
  }

  function addUrl() {
    setUrls((prev) => [...prev, '']);
  }

  function removeUrl(index: number) {
    const next = urls.filter((_, i) => i !== index);
    setUrls(next);
    updateField('urls', next);
  }

  async function handleSave() {
    setIsSaving(true);
    setSaveError(false);
    try {
      await onSave(patch);
      setPatch({});
    } catch {
      setSaveError(true);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!window.confirm(t('confirmDelete'))) return;
    setIsDeleting(true);
    try {
      onDelete();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className={`bg-panel text-background-contrary flex w-full shrink-0 flex-col gap-6 rounded-lg p-4 ${className ?? ''}`}>
      <div className="flex items-center justify-between gap-4">
        {onDelete ? (
          <button type="button" onClick={handleDelete} disabled={isDeleting} title={t('delete')} className={deleteButtonClassName}>
            <Trash2 className="h-4 w-4" />
          </button>
        ) : (
          <div />
        )}
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={handleSave} disabled={isSaving} title={t('save')} className={saveButtonClassName}>
            <Save className="h-4 w-4" />
          </button>
          <button type="button" onClick={onClose} title={t('close')} className={iconButtonClassName}>
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <FieldRow label={t('name')}>
        <input
          type="text"
          defaultValue={trail.name}
          onChange={(e) => updateField('name', e.target.value)}
          className="w-full min-w-0 border-b border-current/30 bg-transparent text-2xl leading-8 font-bold outline-none focus:border-current"
        />
      </FieldRow>

      {saveError && <p className="text-sm text-red-500">{t('saveFailed')}</p>}

      <div className="flex flex-col gap-5">
        <div className="flex gap-4">
          <div className="flex-1">
            <FieldRow label={t('county')}>
              <input type="text" defaultValue={trail.county} onChange={(e) => updateField('county', e.target.value)} className={inputClassName} />
            </FieldRow>
          </div>
          <div className="flex-1">
            <FieldRow label={t('town')}>
              <input type="text" defaultValue={trail.town} onChange={(e) => updateField('town', e.target.value)} className={inputClassName} />
            </FieldRow>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <FieldRow label={t('date')}>
              <input type="date" defaultValue={trail.date} onChange={(e) => updateField('date', e.target.value)} className={inputClassName} />
            </FieldRow>
          </div>
          <div className="flex-1">
            <FieldRow label={t('public')}>
              <TagBadge
                label={t((patch.isPublic ?? trail.isPublic) ? 'yes' : 'no')}
                active={patch.isPublic ?? trail.isPublic}
                onClick={() => updateField('isPublic', !(patch.isPublic ?? trail.isPublic))}
                showHash={false}
              />
            </FieldRow>
          </div>
        </div>

        <FieldRow label={t('mountains')}>
          <MountainMultiSelect
            searchPlaceholder={t('mountainsSearchPlaceholder')}
            selectedIds={patch.mountainIds ?? trail.mountainIds}
            onChange={(ids) => updateField('mountainIds', ids)}
          />
        </FieldRow>

        <FieldRow label={t('links')}>
          <div className="flex w-full flex-col items-start">
            {urls.map((url, index) => (
              <div key={index} className="mb-0 flex w-full items-center gap-2">
                <input
                  type="text"
                  value={url}
                  placeholder={t('linksPlaceholder')}
                  onChange={(e) => updateUrl(index, e.target.value)}
                  className={`${inputClassName} min-w-0 flex-1`}
                />
                <button type="button" onClick={() => removeUrl(index)} title={t('removeLink')} className={iconButtonClassName}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addUrl}
              className="text-background-contrary/60 hover:text-background-contrary flex items-center gap-1 rounded-full py-0.5 text-sm transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              {t('addLink')}
            </button>
          </div>
        </FieldRow>

        <FieldRow label={t('note')}>
          <textarea defaultValue={trail.note} onChange={(e) => updateField('note', e.target.value)} rows={5} className={textareaClassName} />
        </FieldRow>
      </div>
    </div>
  );
}
