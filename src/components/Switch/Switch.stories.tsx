import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import Switch from './Switch';

const meta: Meta<typeof Switch> = {
  title: 'components/Switch',
  component: Switch,
};

export default meta;
type Story = StoryObj<typeof Switch>;

function ControlledSwitch(props: { defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(props.defaultChecked ?? false);
  return <Switch checked={checked} onChange={setChecked} />;
}

export const Off: Story = {
  render: () => <ControlledSwitch defaultChecked={false} />,
};

export const On: Story = {
  render: () => <ControlledSwitch defaultChecked={true} />,
};
