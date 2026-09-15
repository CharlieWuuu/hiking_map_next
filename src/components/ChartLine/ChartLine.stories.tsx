import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import ChartLine from './ChartLine';

const meta: Meta<typeof ChartLine> = {
  title: 'components/ChartLine',
  component: ChartLine,
  decorators: [
    (Story) => (
      <div style={{ width: 400, height: 180 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof ChartLine>;

export const Default: Story = {
  args: {
    data: [
      { date: '2026-01-05', value: 8.2 },
      { date: '2026-02-12', value: 10.5 },
      { date: '2026-03-02', value: 6.1 },
      { date: '2026-04-20', value: 15.8 },
      { date: '2026-05-15', value: 12.3 },
      { date: '2026-06-08', value: 20.4 },
    ],
  },
};

export const Empty: Story = {
  args: {
    data: [],
    emptyLabel: '無資料',
  },
};
