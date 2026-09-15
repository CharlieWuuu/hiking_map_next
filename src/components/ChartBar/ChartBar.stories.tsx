import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import ChartBar from './ChartBar';

const meta: Meta<typeof ChartBar> = {
  title: 'components/ChartBar',
  component: ChartBar,
  decorators: [
    (Story) => (
      <div style={{ width: 400, height: 180 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof ChartBar>;

export const Default: Story = {
  args: {
    data: [
      { label: '一月', value: 12 },
      { label: '二月', value: 19 },
      { label: '三月', value: 7 },
      { label: '四月', value: 24 },
      { label: '五月', value: 15 },
    ],
  },
};

export const SingleValue: Story = {
  args: {
    data: [{ label: '本月', value: 8 }],
  },
};

export const AllZero: Story = {
  args: {
    data: [
      { label: '一月', value: 0 },
      { label: '二月', value: 0 },
      { label: '三月', value: 0 },
    ],
    emptyLabel: '無資料',
  },
};
