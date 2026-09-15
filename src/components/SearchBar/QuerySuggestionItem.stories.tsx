import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import QuerySuggestionItem from './QuerySuggestionItem';

const meta: Meta<typeof QuerySuggestionItem> = {
  title: 'components/SearchBar/QuerySuggestionItem',
  component: QuerySuggestionItem,
  args: {
    item: { type: 'query', text: '雪山主峰' },
    onSelect: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof QuerySuggestionItem>;

export const Default: Story = {};
