import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import SearchBar from './SearchBar';

const meta: Meta<typeof SearchBar> = {
  title: 'components/SearchBar',
  component: SearchBar,
  args: {
    onSubmitQuery: fn(),
    onSelectEntity: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof SearchBar>;

export const Default: Story = {};
