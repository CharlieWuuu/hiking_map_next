import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import ExpandToggleButton from './ExpandToggleButton';

const meta: Meta<typeof ExpandToggleButton> = {
  title: 'profile/data/ExpandToggleButton',
  component: ExpandToggleButton,
  args: {
    onToggle: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof ExpandToggleButton>;

export const Collapsed: Story = {
  args: { isExpanded: false, label: '展開' },
};

export const Expanded: Story = {
  args: { isExpanded: true, label: '收合' },
};
