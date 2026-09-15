import { useTranslations } from 'next-intl';

import TrailDetailCardBody from '../../../../components/TrailDetailCardBody';
import type { EditableTrail } from '../../../../components/TrailEditCard';
import { Link } from '../../../../i18n/navigation';

type Props = {
  trail: EditableTrail;
  mountainNames: string[];
};

// 卡片點開後的詳細內容，跟 /hikes/[id] 單獨頁左邊卡片共用同一顯示元件（TrailDetailCardBody），
// 這裡不需要那頁的返回/編輯按鈕——已經在 /data 清單裡，那些邏輯由外層處理，
// 只多一個前往單獨頁的按鈕
export default function TrailDetailExpanded({ trail, mountainNames }: Props) {
  const t = useTranslations('ProfileDataPage');
  const tEdit = useTranslations('TrailEditCard');

  return (
    <TrailDetailCardBody
      name={trail.name}
      county={trail.county}
      town={trail.town}
      distanceKm={trail.distanceKm}
      distanceUnitLabel={t('distanceUnit')}
      date={trail.date}
      urls={trail.urls}
      linkLabel={(index) => t('linkLabel', { index: index + 1 })}
      mountainNames={mountainNames}
      note={trail.note}
      noteLabel={tEdit('note')}
      isPublic={trail.isPublic}
      publicLabel={tEdit('public')}
      footer={
        <div className="flex justify-center">
          <Link
            href={`/hikes/${trail.slug}`}
            onClick={(e) => e.stopPropagation()}
            className="bg-panel-active hover:bg-panel-active-lighten w-fit rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
          >
            {t('viewDetail')}
          </Link>
        </div>
      }
    />
  );
}
