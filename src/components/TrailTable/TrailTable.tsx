'use client';

import { useTranslations } from 'next-intl';
import { Fragment } from 'react';

type Trail = {
  slug: string;
  name: string;
  county: string;
  town: string;
  date: string;
};

type Props = {
  trails: Trail[];
  activeSlug: string | null;
  onMouseEnter: (slug: string) => void;
  onMouseLeave: () => void;
  onSelect: (slug: string) => void;
  renderEditRow?: (slug: string) => React.ReactNode;
};

export default function TrailTable({ trails, activeSlug, onMouseEnter, onMouseLeave, onSelect, renderEditRow }: Props) {
  const t = useTranslations('TrailTable');

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="text-background-contrary/60 border-b-panel-active border-b text-left">
          <th className="w-10 py-2 font-normal">#</th>
          <th className="py-2 font-normal">{t('name')}</th>
          <th className="py-2 font-normal">{t('county')}</th>
          <th className="py-2 font-normal">{t('town')}</th>
          <th className="py-2 font-normal">{t('date')}</th>
        </tr>
      </thead>
      <tbody>
        {trails.map((trail, index) => {
          const editRow = trail.slug === activeSlug ? renderEditRow?.(trail.slug) : null;
          return (
            <Fragment key={trail.slug}>
              <tr
                onMouseEnter={() => onMouseEnter(trail.slug)}
                onMouseLeave={onMouseLeave}
                onClick={() => onSelect(trail.slug)}
                className={`hover:bg-panel-active/50 cursor-pointer transition-colors duration-150 ${trail.slug === activeSlug ? 'bg-panel-active' : ''}`}
              >
                <td className="py-2">{index + 1}</td>
                <td className="py-2 font-bold">{trail.name}</td>
                <td className="py-2">{trail.county}</td>
                <td className="py-2">{trail.town}</td>
                <td className="py-2">{trail.date}</td>
              </tr>
              {editRow && (
                <tr>
                  <td colSpan={5} className="py-2">
                    {editRow}
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}
