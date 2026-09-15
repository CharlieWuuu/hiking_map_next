import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import MapView from './MapView';

const meta: Meta<typeof MapView> = {
  title: 'components/MapView',
  component: MapView,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    center: [23.7, 120.9],
    zoom: 7,
    className: 'rounded-panel h-full w-full overflow-hidden',
  },
};

export default meta;

type Story = StoryObj<typeof MapView>;

export const Default: Story = {};

export const WithoutZoomControl: Story = {
  args: { showZoomControl: false },
};

export const WithoutLayerSwitcher: Story = {
  args: { showLayerSwitcher: false },
};
