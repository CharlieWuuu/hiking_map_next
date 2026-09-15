import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import Nav from './Nav';

const meta: Meta<typeof Nav> = {
  title: 'components/Nav',
  component: Nav,
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

type Story = StoryObj<typeof Nav>;

export const Default: Story = {};
