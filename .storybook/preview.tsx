import type { Preview } from '@storybook/nextjs-vite';
import { NextIntlClientProvider } from 'next-intl';
import React, { useEffect } from 'react';

import '../src/app/globals.css';

import messages from '../messages/zh-TW.json';

const preview: Preview = {
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme ?? 'dark';
      // .light class 必須掛在 :root（documentElement）本身，而不是巢狀的 div。
      // tokens.css 的 --color-background 等變數是 --theme-xxx 的 alias，
      // 這種 alias 只在宣告當下的元素上求值一次；.light 若掛在子層 div，
      // --theme-background 雖然被覆寫，但 --color-background 仍會沿用 :root 算好的舊值。
      useEffect(() => {
        document.documentElement.classList.toggle('light', theme === 'light');
      }, [theme]);
      return (
        <NextIntlClientProvider locale="zh-TW" messages={messages}>
          <div style={{ background: 'var(--color-background)', color: 'var(--color-background-contrary)', minHeight: '100vh', padding: '1rem' }}>
            <Story />
          </div>
        </NextIntlClientProvider>
      );
    },
  ],
  globalTypes: {
    theme: {
      description: '主題',
      toolbar: {
        title: '主題',
        icon: 'circlehollow',
        items: [
          { value: 'dark', title: 'Dark' },
          { value: 'light', title: 'Light' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'dark',
  },
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },
};

export default preview;
