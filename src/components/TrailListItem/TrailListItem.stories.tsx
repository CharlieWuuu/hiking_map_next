import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import TrailListItem from './TrailListItem';

const meta: Meta<typeof TrailListItem> = {
  title: 'components/TrailListItem',
  component: TrailListItem,
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof TrailListItem>;

// 導航模式：點擊後跳轉到 href，用於個人健行紀錄、路線清單
export const Navigation: Story = {
  args: {
    href: '/hikes/xueshan-main-peak-20260312',
    name: '雪山主峰步道',
    county: '台中市',
    town: '和平區',
    date: '2026-03-12',
    distanceKm: 10.5,
  },
};

// 官方路線目錄（例如搜尋結果）沒有「某次紀錄」的日期/距離，這兩個欄位是 optional
export const NavigationWithoutStats: Story = {
  args: {
    href: '/trails/xueshan-main-peak',
    name: '雪山主峰步道',
    county: '台中市',
    town: '和平區',
  },
};

// 互動模式：不導航，改由 hover/click callback 跟地圖聯動，用於 ProfileTrailExplorer
export const Interactive: Story = {
  args: {
    name: '雪山主峰步道',
    county: '台中市',
    town: '和平區',
    date: '2026-03-12',
    distanceKm: 10.5,
    isActive: false,
    onMouseEnter: fn(),
    onMouseLeave: fn(),
    onClick: fn(),
  },
};

export const InteractiveActive: Story = {
  args: {
    name: '雪山主峰步道',
    county: '台中市',
    town: '和平區',
    date: '2026-03-12',
    distanceKm: 10.5,
    isActive: true,
    onMouseEnter: fn(),
    onMouseLeave: fn(),
    onClick: fn(),
  },
};
