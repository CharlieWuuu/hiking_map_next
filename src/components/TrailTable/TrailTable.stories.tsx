import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import TrailTable from './TrailTable';

const trails = [
  { slug: 'xueshan-main-peak', name: '雪山主峰步道', county: '台中市', town: '和平區', date: '2026-03-12' },
  { slug: 'hehuanshan-east-peak', name: '合歡山東峰', county: '南投縣', town: '仁愛鄉', date: '2026-02-20' },
  { slug: 'yushan-main-peak', name: '玉山主峰步道', county: '南投縣', town: '信義鄉', date: '2026-01-05' },
];

const meta: Meta<typeof TrailTable> = {
  title: 'components/TrailTable',
  component: TrailTable,
  args: {
    trails,
    activeSlug: null,
    onMouseEnter: fn(),
    onMouseLeave: fn(),
    onSelect: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof TrailTable>;

export const Default: Story = {};

export const WithActiveRow: Story = {
  args: { activeSlug: 'hehuanshan-east-peak' },
};

export const WithEditRow: Story = {
  args: {
    activeSlug: 'hehuanshan-east-peak',
    renderEditRow: (slug) => <div className="bg-panel-active/50 rounded-panel p-2 text-xs">正在編輯 {slug}⋯</div>,
  },
};

export const Empty: Story = {
  args: { trails: [] },
};
