import { ExternalLink, Lock, Unlock } from 'lucide-react';
import type { ReactNode } from 'react';

import TagBadge from '../TagBadge';

// 數字跟單位分開排版（單位字級較小），所以只格式化數字本身，最多兩位小數且去掉尾零
const distanceFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

type Props = {
  name: string;
  county: string;
  town: string;
  distanceKm?: number;
  distanceUnitLabel: string;
  date?: string;
  urls: string[];
  linkLabel: (index: number) => string;
  mountainNames: string[];
  note?: string;
  noteLabel?: string;
  coverImageUrl?: string | null;
  // 公開/不公開的鎖頭圖示；不傳就不顯示（例如編輯表單另外處理這個狀態的地方）
  isPublic?: boolean;
  publicLabel?: string;
  // 標題列右側的操作按鈕（返回/編輯等），單獨頁跟清單展開卡各自決定要不要有
  headerActions?: ReactNode;
  // 卡片最下方的額外內容（例如清單展開卡的「前往完整頁面」按鈕）
  footer?: ReactNode;
  className?: string;
};

// /hikes/[id] 單獨頁左邊卡片跟 /data 清單展開卡共用的顯示樣式：黑底、大標題、距離數字、
// 山頭標籤同一排。單獨頁跟清單各自的返回/編輯按鈕、前往完整頁按鈕透過 headerActions/footer 插入
export default function TrailDetailCardBody({
  name,
  county,
  town,
  distanceKm,
  distanceUnitLabel,
  date,
  urls,
  linkLabel,
  mountainNames,
  note,
  noteLabel,
  coverImageUrl,
  isPublic,
  publicLabel,
  headerActions,
  footer,
  className,
}: Props) {
  return (
    <div className={`bg-panel text-background-contrary rounded-panel flex flex-col overflow-hidden ${className ?? ''}`}>
      {coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverImageUrl} alt="" className="h-40 w-full object-cover" />
      )}

      <div className="flex flex-col gap-3 p-4 sm:p-5">
        {headerActions && <div className="mb-1">{headerActions}</div>}
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
            <h1 className="text-2xl leading-none font-bold sm:text-4xl">{name}</h1>
            {urls.map((url, index) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                title={linkLabel(index)}
                className="text-accent shrink-0 pb-0.5 opacity-80 transition-opacity hover:opacity-100"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            ))}
            {mountainNames.map((mountainName) => (
              <TagBadge key={mountainName} label={mountainName} />
            ))}
          </div>
          {isPublic !== undefined && (
            <span title={isPublic ? publicLabel : undefined} className="text-background-contrary/60 mb-0.5 shrink-0">
              {isPublic ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            </span>
          )}
        </div>
        {(county || town) && <p className="text-background-contrary/60 text-sm">{[county, town].filter(Boolean).join(' ')}</p>}
      </div>

      {(distanceKm !== undefined || date) && (
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-4 sm:px-5">
          {distanceKm !== undefined && (
            <p className="text-accent leading-none font-bold">
              <span className="text-2xl sm:text-4xl">{distanceFormatter.format(distanceKm)}</span>
              <span className="ml-1 text-sm sm:text-base">{distanceUnitLabel}</span>
            </p>
          )}
          {date && <p className="text-background-contrary/60 text-base sm:text-lg">{date}</p>}
        </div>
      )}

      {note && (
        <div className="flex flex-col gap-2 p-4 sm:p-5">
          {noteLabel && (
            <div className="flex items-center gap-2">
              <span className="text-background-contrary/50 shrink-0 text-xs tracking-wide uppercase">{noteLabel}</span>
              <div className="bg-background-contrary/15 h-px flex-1" />
            </div>
          )}
          <p className="text-sm whitespace-pre-wrap sm:text-base">{note}</p>
        </div>
      )}

      {footer && <div className="p-4 pt-0 sm:p-5 sm:pt-0">{footer}</div>}
    </div>
  );
}
