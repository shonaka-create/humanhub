'use client';

import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--paper)', color: 'var(--ink)' }}>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <Header />
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px 64px' }}>{children}</div>
      </main>
    </div>
  );
}
