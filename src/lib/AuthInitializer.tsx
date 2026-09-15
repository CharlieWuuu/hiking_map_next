'use client';

import { useEffect } from 'react';

import { useAuth } from './authStore';

// App 掛載時觸發一次登入狀態檢查，之後 login/logout 各自維護 store 狀態
export default function AuthInitializer() {
  const refresh = useAuth((state) => state.refresh);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return null;
}
