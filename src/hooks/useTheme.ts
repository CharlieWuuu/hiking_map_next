'use client';

import { useSyncExternalStore } from 'react';

import { applyTheme, getServerTheme, getStoredTheme, subscribeTheme, type Theme } from '../lib/theme';

export function useTheme() {
  const theme = useSyncExternalStore(subscribeTheme, getStoredTheme, getServerTheme);

  function setTheme(next: Theme) {
    applyTheme(next);
  }

  return { theme, setTheme };
}
