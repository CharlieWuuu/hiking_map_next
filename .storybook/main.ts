import type { StorybookConfig } from '@storybook/nextjs-vite';
import svgr from 'vite-plugin-svgr';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@chromatic-com/storybook', '@storybook/addon-vitest', '@storybook/addon-a11y', '@storybook/addon-docs', '@storybook/addon-mcp'],
  framework: '@storybook/nextjs-vite',
  staticDirs: ['../public'],
  // next.config.ts 的 turbopack SVGR 規則只在 `next dev`/`next build` 生效，
  // Storybook 走 Vite，要另外掛 vite-plugin-svgr 才能把 .svg import 成 React 元件
  async viteFinal(viteConfig) {
    viteConfig.plugins ??= [];
    viteConfig.plugins.push(svgr({ svgrOptions: { svgo: false } }));
    return viteConfig;
  },
};
export default config;
