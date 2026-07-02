'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import type { CurrentUser } from '@/lib/data';

export function AppShell({ children, user }: { children: React.ReactNode; user: CurrentUser | null }) {
  const pathname = usePathname();
  // タブレット/SP ではサイドバーをドロワー化する。開閉状態のみ React で持ち、
  // 表示切り替え自体は CSS のメディアクエリ（.app-sidebar 等）に任せる。
  const [navOpen, setNavOpen] = useState(false);

  // ログイン画面ではサイドバー/ヘッダーを表示しない。
  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--paper)', color: 'var(--ink)' }}>
      {/* ナビ選択（＝画面遷移）でドロワーを閉じる。 */}
      <Sidebar user={user} open={navOpen} onNavigate={() => setNavOpen(false)} />
      <div
        className={`app-backdrop${navOpen ? ' is-open' : ''}`}
        onClick={() => setNavOpen(false)}
        aria-hidden
      />
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <Header user={user} onMenu={() => setNavOpen(true)} />
        <div className="app-content" style={{ flex: 1, overflowY: 'auto', padding: '32px 40px 64px' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
