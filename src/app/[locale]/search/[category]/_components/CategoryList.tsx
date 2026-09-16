'use client';

import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Link } from '../../../../../i18n/navigation';

export type CategoryItem = {
  id: number | string;
  name: string;
  county: string | null;
  elevationM?: number;
  range?: string | null;
  completed?: boolean;
  href?: string;
};

type Filter = 'all' | 'completed' | 'notYet';

export default function CategoryList({ items }: { items: CategoryItem[] }) {
  const t = useTranslations('CategoryPage');
  const [filter, setFilter] = useState<Filter>('all');

  // completed 只有山頭名單才有；步道名單不顯示進度與篩選
  const hasProgress = items.some((item) => item.completed !== undefined);
  const completedCount = items.filter((item) => item.completed).length;

  const visible = !hasProgress || filter === 'all' ? items : items.filter((item) => (filter === 'completed' ? item.completed : !item.completed));

  if (items.length === 0) {
    return <p className="text-background-contrary/60 text-sm">{t('empty')}</p>;
  }

  return (
    <div className="flex min-h-0 flex-col gap-4">
      {hasProgress && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-background-contrary/60 text-sm">{t('progress', { completed: completedCount, total: items.length })}</span>
          <div className="flex gap-1">
            {(['all', 'completed', 'notYet'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded-panel px-3 py-1 text-sm transition-colors ${
                  filter === key ? 'bg-accent text-accent-contrast' : 'bg-panel hover:bg-panel-active text-background-contrary'
                }`}
              >
                {t(key === 'all' ? 'filterAll' : key === 'completed' ? 'filterCompleted' : 'filterNotYet')}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="scrollbar-subtle grid min-h-0 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((item) => {
          const content = (
            <>
              <span className="flex min-w-0 items-center gap-2">
                {item.completed && <Check className="text-accent h-4 w-4 shrink-0" aria-label={t('completed')} />}
                <span className="truncate font-bold">{item.name}</span>
              </span>
              <span className="text-background-contrary/60 shrink-0 text-sm">
                {item.elevationM ? `${item.elevationM.toLocaleString()} ${t('elevationUnit')}` : (item.county ?? '')}
              </span>
            </>
          );
          // 完成度用底色深淺區分，而不是只靠打勾——色弱也看得出來
          const className = `bg-panel rounded-panel flex items-center justify-between gap-2 px-3 py-2 ${hasProgress && !item.completed ? 'opacity-50' : ''}`;

          return item.href ? (
            <Link key={item.id} href={item.href} className={`${className} hover:bg-panel-active transition-colors`}>
              {content}
            </Link>
          ) : (
            <div key={item.id} className={className}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
