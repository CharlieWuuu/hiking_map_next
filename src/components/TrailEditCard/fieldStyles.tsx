import type { ReactNode } from 'react';

// 編輯卡片與上傳表單共用的欄位樣式，維持同一套視覺語言
export const inputClassName = 'border-current/30 text-background-contrary w-full border-b bg-transparent py-0.5 text-sm outline-none focus:border-current';
export const textareaClassName =
  'border-current/30 text-background-contrary w-full resize-none rounded border bg-transparent px-2 py-1.5 text-sm outline-none focus:border-current';
export const iconButtonClassName =
  'bg-panel-active text-background-contrary hover:bg-panel-active-lighten flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-150 cursor-pointer';

// 左邊固定寬度 label、右邊 input 的統一列排版
export function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-background-contrary/60 w-14 shrink-0 pt-0.5 text-right text-sm">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
