import { LayoutGrid, Pencil, Table, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import ExpandToggleButton from './ExpandToggleButton';
import ExportMenu from './ExportMenu';

type Props = {
  isTableExpanded: boolean;
  onToggleTableExpanded: () => void;
  view: 'card' | 'table';
  onToggleView: () => void;
  isOwner: boolean;
  isEditMode: boolean;
  onToggleEditMode: () => void;
};

export default function TrailExplorerToolbar({ isTableExpanded, onToggleTableExpanded, view, onToggleView, isOwner, isEditMode, onToggleEditMode }: Props) {
  const t = useTranslations('ProfileDataPage');

  return (
    // pr-2 補足清單捲動時右側捲軸佔用的寬度，避免工具列跟清單右邊界對不齊
    <div className="flex items-center justify-between pr-2">
      <ExpandToggleButton isExpanded={isTableExpanded} onToggle={onToggleTableExpanded} label={isTableExpanded ? t('collapse') : t('expand')} />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleView}
          title={view === 'card' ? t('viewTable') : t('viewCard')}
          className="bg-panel hover:bg-panel-active flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors"
        >
          {view === 'card' ? <Table className="h-3.5 w-3.5" /> : <LayoutGrid className="h-3.5 w-3.5" />}
        </button>

        {isOwner && (
          <button
            type="button"
            onClick={onToggleEditMode}
            title={isEditMode ? t('exitEdit') : t('goToEdit')}
            className="bg-panel hover:bg-panel-active flex h-7 shrink-0 items-center gap-1 rounded-full px-3 text-xs transition-colors"
          >
            {isEditMode ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
            {isEditMode ? t('exitEdit') : t('goToEdit')}
          </button>
        )}

        {isEditMode && <ExportMenu label={t('export')} />}
      </div>
    </div>
  );
}
