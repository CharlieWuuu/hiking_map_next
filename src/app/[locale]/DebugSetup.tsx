'use client';

import { DebugOverlay, DebugProvider } from 'react-component-overlay';

import { useAuth } from '../../lib/authStore';

// globalState 的值是 hook（函式），而 server component 不能把函式當 prop
// 傳給 client component，所以要在 client 這一側組裝好再交出去
export default function DebugSetup({ children }: { children: React.ReactNode }) {
  return (
    <DebugProvider globalState={{ auth: useAuth }}>
      {children}
      <DebugOverlay />
    </DebugProvider>
  );
}
