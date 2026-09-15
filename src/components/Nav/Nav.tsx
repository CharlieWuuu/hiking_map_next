'use client';

import { PanelLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSyncExternalStore } from 'react';

import LogoMark from '../../assets/logo-mark.svg?react';
import Logo from '../../assets/logo.svg?react';
import { Link, usePathname } from '../../i18n/navigation';
import { useAuth } from '../../lib/authStore';
import { NAV_COLLAPSED_EVENT, NAV_COLLAPSED_STORAGE_KEY } from './Nav.const';
import { getNavItems } from './Nav.data';

// 收合狀態存在 localStorage，對 React 來說是外部資料來源。
// 用 useSyncExternalStore 讀取，才不需要在 effect 裡補一次 setState——
// 那會多觸發一輪 render，而且 lint 也擋
const collapsedStore = {
  subscribe(onChange: () => void) {
    window.addEventListener(NAV_COLLAPSED_EVENT, onChange);
    return () => window.removeEventListener(NAV_COLLAPSED_EVENT, onChange);
  },
  getSnapshot() {
    return localStorage.getItem(NAV_COLLAPSED_STORAGE_KEY) === 'true';
  },
  // 伺服器端讀不到 localStorage。畫面不會閃是因為 layout 的 inline script
  // 已經先在 <html> 掛上 nav-collapsed，寬度由 CSS 決定
  getServerSnapshot() {
    return false;
  },
};

// data 的路徑（/profile/x/data）是 profile 路徑（/profile/x）的子路徑，
// 兩個 href 對同一個 pathname 都會 startsWith 成功，需要挑「最長匹配」
// 才能讓同一時間只有一個項目被標成 active。
function findActiveHref(pathname: string, hrefs: string[]): string | null {
  if (pathname === '/') return hrefs.includes('/') ? '/' : null;

  const matches = hrefs.filter((href) => href !== '/' && pathname.startsWith(href));
  if (matches.length === 0) return null;

  return matches.reduce((longest, current) => (current.length > longest.length ? current : longest));
}

export default function Nav() {
  const pathname = usePathname();
  const t = useTranslations('Nav');
  // 只訂閱 username，不然登入狀態任何一個欄位變動都會讓整個 Nav 重畫
  const username = useAuth((state) => state.username);
  const navItems = getNavItems(username);
  const activeHref = findActiveHref(
    pathname,
    navItems.map((item) => item.href)
  );
  const isCollapsed = useSyncExternalStore(collapsedStore.subscribe, collapsedStore.getSnapshot, collapsedStore.getServerSnapshot);

  function toggleCollapsed() {
    const next = !isCollapsed;
    localStorage.setItem(NAV_COLLAPSED_STORAGE_KEY, String(next));
    document.documentElement.classList.toggle('nav-collapsed', next);
    window.dispatchEvent(new Event(NAV_COLLAPSED_EVENT));
  }

  return (
    <>
      {/* 窄螢幕：底部導覽列。跟 main 一起放進外層的 flex-col，佔實際版面空間（不是 fixed 浮在最上層），
          這樣 main 才知道底部被佔用多少高度，內容捲到底才不會被這排導覽列蓋住 */}
      <nav className="bg-nav border-nav-border order-2 flex shrink-0 justify-around border-t py-4 lg:hidden">
        {navItems.map(({ messageKey, href, Icon }) => (
          <Link
            key={messageKey}
            href={href}
            className={`flex flex-col items-center gap-1 text-xs ${href === activeHref ? 'text-accent' : 'text-background-contrary'}`}
          >
            <Icon className="h-6 w-6" />
            {t(messageKey)}
          </Link>
        ))}
      </nav>

      {/* 寬螢幕：左側導覽列。在正常流中排版，寬度變化不需要 main 那邊補償 */}
      <nav
        className="bg-nav border-nav-border sticky top-0 hidden h-dvh shrink-0 flex-col gap-4 border-r px-4 py-8 lg:flex"
        style={{ width: 'var(--nav-width)' }}
      >
        {/* 內距與下方選單項目相同，logo 因此和項目共用同一條左緣與同一個寬度上限 */}
        <Link href="/" className={`flex items-center overflow-hidden ${isCollapsed ? 'justify-center px-0' : 'px-3'}`}>
          {isCollapsed ? <LogoMark className="h-7 w-7" /> : <Logo className="h-auto w-full" />}
        </Link>
        <div className="flex flex-col gap-1">
          {navItems.map(({ messageKey, href, Icon }) => (
            <Link
              key={messageKey}
              href={href}
              title={isCollapsed ? t(messageKey) : undefined}
              className={`hover:bg-panel-active-lighten/50 rounded-panel flex items-center gap-2 py-2 text-sm transition-colors duration-150 ${
                isCollapsed ? 'justify-center px-0' : 'px-3'
              } ${href === activeHref ? 'text-accent' : 'text-background-contrary'}`}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              {!isCollapsed && t(messageKey)}
            </Link>
          ))}
        </div>
        <button
          type="button"
          onClick={toggleCollapsed}
          className={`hover:bg-panel-active-lighten/50 rounded-panel text-background-contrary/60 mt-auto flex h-8 w-8 items-center justify-center transition-colors duration-150 ${
            isCollapsed ? 'self-center' : 'self-end'
          }`}
        >
          <PanelLeft className="h-4.5 w-4.5" />
        </button>
      </nav>
    </>
  );
}
