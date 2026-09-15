import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import ProfileTrailExplorer from './ProfileTrailExplorer';

const trails = [
  {
    slug: 'xueshan-main-peak-20260312',
    name: '雪山主峰步道',
    county: '台中市',
    town: '和平區',
    date: '2026-03-12',
    distanceKm: 10.5,
    isPublic: true,
    mountainIds: [1],
    urls: [],
    path: [
      [121.2, 24.4],
      [121.22, 24.42],
      [121.25, 24.41],
    ] as [number, number][],
  },
  {
    slug: 'hehuanshan-east-peak-20260220',
    name: '合歡山東峰',
    county: '南投縣',
    town: '仁愛鄉',
    date: '2026-02-20',
    distanceKm: 3.2,
    isPublic: true,
    mountainIds: [],
    urls: [],
    path: [
      [121.27, 24.14],
      [121.28, 24.15],
    ] as [number, number][],
  },
];

const meta: Meta<typeof ProfileTrailExplorer> = {
  title: 'profile/data/ProfileTrailExplorer',
  component: ProfileTrailExplorer,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    trails,
    totalCount: trails.length,
    initialNextCursor: null,
    userId: '1',
    fullscreen: null,
    isEditMode: false,
    isOwner: true,
    onFullscreenChange: fn(),
    onToggleEditMode: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof ProfileTrailExplorer>;

export const Default: Story = {};

export const EditMode: Story = {
  args: { isEditMode: true },
};

export const Viewer: Story = {
  args: { isOwner: false },
};

export const Empty: Story = {
  args: { trails: [] },
};
