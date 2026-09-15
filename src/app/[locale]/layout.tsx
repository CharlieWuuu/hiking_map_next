import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { Geist, Geist_Mono } from 'next/font/google';
import { notFound } from 'next/navigation';

import '../globals.css';

import { COMMIT_HOOK_INSTALLER } from 'react-component-overlay';

import Nav from '../../components/Nav';
import { NAV_COLLAPSED_STORAGE_KEY } from '../../components/Nav/Nav.const';
import { routing } from '../../i18n/routing';
import AuthInitializer from '../../lib/AuthInitializer';
import { THEME_STORAGE_KEY } from '../../lib/theme';
import DebugSetup from './DebugSetup';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* React 一載入就會去讀 DevTools 掛鉤，所以這段必須早於所有 bundle，且只在開發環境注入 */}
        {process.env.NODE_ENV === 'development' && <script dangerouslySetInnerHTML={{ __html: COMMIT_HOOK_INSTALLER }} />}
        <script
          dangerouslySetInnerHTML={{
            __html: `if (localStorage.getItem('${THEME_STORAGE_KEY}') === 'light') document.documentElement.classList.add('light');
if (localStorage.getItem('${NAV_COLLAPSED_STORAGE_KEY}') === 'true') document.documentElement.classList.add('nav-collapsed');`,
          }}
        />
      </head>
      <body className="flex h-full flex-col">
        <NextIntlClientProvider messages={messages}>
          <DebugSetup>
            <AuthInitializer />
            {/* 寬螢幕時是 Nav 與 main 並排的 flex 容器，Nav 佔的寬度由它自己決定。
                固定在 dvh，讓 main 自己捲動，才有明確高度上限可以讓 flex-1 的頁面（例如地圖）真正撐滿視窗而不是被內容撐高 */}
            <div className="flex h-dvh flex-col lg:flex-row">
              <Nav />
              {/* main 是捲動容器，用 grid 而不是 flex：grid 的 align-content 預設會讓 row 高度以
                  內容為準，內容比視窗高時整個 grid 自然撐高，padding 兩端都會確實計入捲動範圍。
                  （flex + flex-1 子元素會讓 Chrome 漏算 padding-bottom，捲到底時內容貼齊視窗底部。）
                  row 用 minmax(min-content,1fr)：內容不足一頁時撐滿高度（地圖頁才能滿版），
                  內容超過時以 min-content 為準讓 main 正常捲動 */}
              <main className="scrollbar-subtle grid min-h-0 min-w-0 flex-1 grid-rows-[minmax(min-content,1fr)] overflow-y-auto p-4 lg:p-6 lg:pb-12">
                {/* 預設限制閱讀寬度；地圖等需要撐滿版面的頁面用 .page-wide 取消上限。
                    grid item 預設 stretch 會撐滿 row 的高度，min-h-0 讓內部的 flex-1／overflow
                    子元素（例如資料頁的地圖）能收縮到這個高度內，而不是被內容撐開 */}
                <div className="page-content-width mx-auto flex min-h-0 w-full min-w-0 flex-col">{children}</div>
              </main>
            </div>
          </DebugSetup>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
