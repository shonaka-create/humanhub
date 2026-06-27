'use client';

import { usePathname } from 'next/navigation';
import { useLang } from '@/i18n/LangProvider';
import { navItemForPath } from '@/lib/nav';

export function Header() {
  const pathname = usePathname();
  const { t } = useLang();
  const title = t[navItemForPath(pathname).labelKey];

  return (
    <header
      style={{
        height: 68,
        flex: 'none',
        borderBottom: '1px solid var(--line)',
        background: 'rgba(251,249,245,.88)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: '0 40px',
      }}
    >
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 600, margin: 0, lineHeight: 1 }}>{title}</h1>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 18 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: 999,
            padding: '8px 14px',
            width: 230,
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ink3)" strokeWidth="1.8">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            placeholder={t.search}
            style={{ border: 'none', outline: 'none', background: 'none', font: '13px var(--ui)', color: 'var(--ink)', width: '100%' }}
          />
        </div>
        <span style={{ fontSize: 12.5, color: 'var(--ink2)', whiteSpace: 'nowrap' }}>{t.dateStr}</span>
        <div style={{ position: 'relative', display: 'flex' }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--ink2)" strokeWidth="1.6">
            <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinejoin="round" />
            <path d="M13.5 21a2 2 0 0 1-3 0" strokeLinecap="round" />
          </svg>
          <span style={{ position: 'absolute', top: -2, right: -2, width: 7, height: 7, borderRadius: '50%', background: 'var(--rose)' }} />
        </div>
      </div>
    </header>
  );
}
