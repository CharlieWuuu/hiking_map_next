import { useTranslations } from 'next-intl';

import { Link } from '../../i18n/navigation';
import TagBadge from '../TagBadge';

type Badge = { label: string; tone?: 'accent' | 'neutral' };

type DisplayProps = {
  name: string;
  county: string;
  town: string;
  date?: string;
  distanceKm?: number;
  badges?: Badge[];
  // 不公開路線不用另外標籤，整張卡片淡化提示只有本人看得到
  isPublic?: boolean;
};

type NavigationProps = DisplayProps & {
  href: string;
  onMouseEnter?: never;
  onMouseLeave?: never;
  onClick?: never;
  isActive?: never;
};

type InteractiveProps = DisplayProps & {
  href?: never;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
  isActive: boolean;
};

type Props = NavigationProps | InteractiveProps;

function TrailListItemContent({ name, county, town, date, distanceKm, badges }: DisplayProps) {
  const t = useTranslations('TrailListItem');
  const hasStats = date !== undefined || distanceKm !== undefined;

  return (
    <>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate text-lg font-bold">{name}</span>
          {badges &&
            badges.length > 0 &&
            badges.map((badge) => <TagBadge key={badge.label} label={badge.label} tone={badge.tone === 'neutral' ? 'neutral' : 'accent'} />)}
        </div>
        <span className="text-background-contrary/60 text-sm">
          {county} {town}
        </span>
      </div>

      {hasStats && (
        <>
          <div className="bg-panel-active w-0.5 shrink-0 self-stretch" />

          <div className="flex w-20 shrink-0 flex-col items-end justify-center gap-1">
            {date !== undefined && <span className="text-background-contrary/60 text-xs">{date}</span>}
            {distanceKm !== undefined && <span className="font-bold">{t('distanceValue', { distance: distanceKm })}</span>}
          </div>
        </>
      )}
    </>
  );
}

export default function TrailListItem(props: Props) {
  if (props.href !== undefined) {
    return (
      <Link
        href={props.href}
        className="bg-panel hover:bg-panel-active rounded-panel relative flex w-full shrink-0 items-stretch gap-4 overflow-hidden transition-colors duration-150"
      >
        <div className="flex min-w-0 flex-1 items-center gap-4 p-4">
          <TrailListItemContent {...props} />
        </div>
      </Link>
    );
  }

  const { isActive, onMouseEnter, onMouseLeave, onClick } = props;

  return (
    <button
      type="button"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      className={`rounded-panel relative flex w-full shrink-0 cursor-pointer items-stretch gap-4 overflow-hidden text-left transition-colors duration-150 ${
        isActive ? 'bg-panel-active outline-accent outline-2 -outline-offset-2' : 'bg-panel hover:bg-panel-active'
      } ${props.isPublic === false ? 'opacity-60' : ''}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4 p-4">
        <TrailListItemContent {...props} />
      </div>
    </button>
  );
}
