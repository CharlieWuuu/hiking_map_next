export const THEME_STORAGE_KEY = 'theme';

export type Theme = 'dark' | 'light';

const listeners = new Set<() => void>();

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('light', theme === 'light');
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  listeners.forEach((listener) => listener());
}

export function getStoredTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'light' ? 'light' : 'dark';
}

// 給 useSyncExternalStore 用：訂閱本頁透過 applyTheme 觸發的變化
export function subscribeTheme(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// SSR 階段沒有 localStorage，固定回傳 dark 當作伺服器端快照
export function getServerTheme(): Theme {
  return 'dark';
}
