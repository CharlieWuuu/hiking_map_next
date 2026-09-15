type Props = {
  label: string;
  tone?: 'accent' | 'neutral';
  // 傳了 onClick 就會渲染成可互動的 button（用於編輯表單的可切換/可移除標籤），
  // 不傳則是單純顯示用的 span（詳情卡片、清單徽章）
  onClick?: () => void;
  active?: boolean;
  removable?: boolean;
  // 是/否這種二元切換（例如公開狀態）不是標籤，不用加 # 前綴
  showHash?: boolean;
};

// 各處通用的 pill 樣式（分類、山頭、卡片徽章、是/否切換都共用），accent 用強調色、neutral 用中性灰底
export default function TagBadge({ label, tone = 'neutral', onClick, active, removable, showHash = true }: Props) {
  const className = `rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors duration-150 ${
    tone === 'accent' || active ? 'bg-accent text-accent-contrast' : 'bg-panel-active text-background-contrary/70'
  } ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`;

  const content = (
    <>
      {showHash && '#'}
      {label}
      {removable && ' ×'}
    </>
  );

  if (onClick) {
    return (
      <button type="button" aria-pressed={active} onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  return <span className={className}>{content}</span>;
}
