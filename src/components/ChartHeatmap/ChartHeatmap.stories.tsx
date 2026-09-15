import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import ChartHeatmap from './ChartHeatmap';

const meta: Meta<typeof ChartHeatmap> = {
  title: 'components/ChartHeatmap',
  component: ChartHeatmap,
  decorators: [
    (Story) => (
      <div style={{ width: 300, height: 220 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof ChartHeatmap>;

export const Default: Story = {
  args: {
    data: [
      { label: '01', value: 0 },
      { label: '02', value: 5 },
      { label: '03', value: 12 },
      { label: '04', value: 3 },
      { label: '05', value: 20 },
      { label: '06', value: 8 },
      { label: '07', value: 0 },
      { label: '08', value: 15 },
      { label: '09', value: 6 },
      { label: '10', value: 1 },
      { label: '11', value: 0 },
      { label: '12', value: 9 },
    ],
  },
};

export const AllZero: Story = {
  args: {
    data: [
      { label: '01', value: 0 },
      { label: '02', value: 0 },
      { label: '03', value: 0 },
    ],
    emptyLabel: '無資料',
  },
};
