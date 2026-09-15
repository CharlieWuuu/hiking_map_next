import { create } from 'zustand';

import { getCurrentSession, login as loginAction, logout as logoutAction } from './db/auth.actions';

type AuthState = {
  isLoggedIn: boolean;
  isLoading: boolean;
  userId: number | null;
  username: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

export const useAuth = create<AuthState>((set, get) => ({
  isLoggedIn: false,
  isLoading: true,
  userId: null,
  username: null,

  refresh: async () => {
    try {
      const session = await getCurrentSession();
      if (session) {
        set({ userId: session.userId, username: session.username, isLoggedIn: true });
      } else {
        set({ userId: null, username: null, isLoggedIn: false });
      }
    } catch {
      set({ userId: null, username: null, isLoggedIn: false });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (username, password) => {
    const result = await loginAction(username, password);
    // 密碼錯誤時丟出錯誤，維持原本 apiClient 失敗即 reject 的行為，登入表單的 catch 才顯示得到訊息
    if (!result.ok) throw new Error(result.error);
    await get().refresh();
  },

  logout: async () => {
    await logoutAction();
    set({ userId: null, username: null, isLoggedIn: false });
  },
}));
