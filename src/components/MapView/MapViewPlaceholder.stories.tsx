import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import MapViewPlaceholder from './MapViewPlaceholder';

const meta: Meta<typeof MapViewPlaceholder> = {
  title: 'components/MapView/MapViewPlaceholder',
  component: MapViewPlaceholder,
};

export default meta;

type Story = StoryObj<typeof MapViewPlaceholder>;

export const Default: Story = {};
