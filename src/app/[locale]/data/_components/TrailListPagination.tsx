'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

type Props = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
};

const buttonClassName =
  'bg-panel-active text-background-contrary hover:bg-panel-active-lighten flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50';

export default function TrailListPagination({ page, pageCount, onPageChange }: Props) {
  const t = useTranslations('ProfileDataPage');

  if (pageCount <= 1) return null;

  return (
    <div className="flex shrink-0 items-center justify-center gap-3">
      <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1} title={t('previousPage')} className={buttonClassName}>
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-sm">{t('pageIndicator', { page, pageCount })}</span>
      <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount} title={t('nextPage')} className={buttonClassName}>
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
