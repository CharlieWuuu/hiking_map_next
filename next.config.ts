import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // 預設在左下，會壓到側欄的收合鈕，移到右下
  devIndicators: {
    position: 'bottom-right',
  },
  turbopack: {
    rules: {
      '*.svg': [
        {
          // import Logo from './logo.svg?react' → 轉成 React 元件，可用 className/currentColor 控制樣式
          // svgo: false，避免 SVGO 優化步驟拿掉 viewBox（會讓 CSS 縮放時內容被裁切而非等比縮放）
          // 用 ?react 而非無 query 觸發，是為了跟 Storybook 那邊的 vite-plugin-svgr 用同一套規則
          // （Storybook 走 Vite，其 vite-plugin-storybook-nextjs 只在 ?react query 時才讓路給 svgr）
          condition: { query: /react/ },
          loaders: [{ loader: '@svgr/webpack', options: { svgo: false } }],
          as: '*.js',
        },
        {
          // import logoUrl from './logo.svg' 或 './logo.svg?url' → 當靜態檔案，回傳圖片網址
          type: 'asset',
        },
      ],
    },
  },
};

export default withNextIntl(nextConfig);
