import { ChartPie, Home, Map, Search, Settings, Upload } from 'lucide-react';

import type { NavItem } from './Nav.types';

// 個人頁面（data、chart、upload）只顯示／服務登入者自己的資料，未登入時導去登入頁
export function getNavItems(username: string | null): NavItem[] {
  const isLoggedIn = Boolean(username);
  return [
    { messageKey: 'home', href: '/', Icon: Home },
    { messageKey: 'search', href: '/search', Icon: Search },
    { messageKey: 'data', href: isLoggedIn ? '/data' : '/login', Icon: Map },
    { messageKey: 'upload', href: isLoggedIn ? '/hikes/new' : '/login', Icon: Upload },
    { messageKey: 'profile', href: isLoggedIn ? '/chart' : '/login', Icon: ChartPie },
    { messageKey: 'settings', href: '/settings', Icon: Settings },
  ];
}
