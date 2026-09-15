import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import TrailEditCard from './TrailEditCard';

const meta: Meta<typeof TrailEditCard> = {
  title: 'components/TrailEditCard',
  component: TrailEditCard,
  args: {
    onClose: fn(),
    onSave: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof TrailEditCard>;

export const Default: Story = {
  args: {
    trail: {
      slug: 'xueshan-main-peak-20260312',
      name: '雪山主峰步道',
      county: '台中市',
      town: '和平區',
      date: '2026-03-12',
      distanceKm: 10.5,
      isPublic: true,
      mountainIds: [1],
      urls: ['https://example.com/trip-report'],
    },
  },
};

export const NoLinksNoNote: Story = {
  args: {
    trail: {
      slug: 'hehuanshan-east-peak-20260220',
      name: '合歡山東峰',
      county: '南投縣',
      town: '仁愛鄉',
      date: '2026-02-20',
      distanceKm: 3.2,
      isPublic: false,
      mountainIds: [],
      urls: [],
    },
  },
};
