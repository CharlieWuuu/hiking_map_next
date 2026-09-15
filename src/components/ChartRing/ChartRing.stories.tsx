import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import ChartRing from './ChartRing';

const meta: Meta<typeof ChartRing> = {
  title: 'components/ChartRing',
  component: ChartRing,
  args: {
    label: '總爬升成就',
    value: 72,
  },
};

export default meta;

type Story = StoryObj<typeof ChartRing>;

export const Default: Story = {};

export const Full: Story = {
  args: { value: 100 },
};

export const Empty: Story = {
  args: { value: 0 },
};

export const Small: Story = {
  args: { size: 60, strokeWidth: 6 },
};
