export const NAV_COLLAPSED_STORAGE_KEY = 'nav-collapsed';

// 收合狀態改動時自己發的事件，讓 useSyncExternalStore 知道要重讀 localStorage
// （storage 事件只在「其他分頁」改動時才會觸發，同一頁收不到）
export const NAV_COLLAPSED_EVENT = 'nav-collapsed-change';
