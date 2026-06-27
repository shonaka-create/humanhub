'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLang } from '@/i18n/LangProvider';
import { NAV, navItemForPath, type NavKey } from '@/lib/nav';

const icons: Record<NavKey, React.ReactNode> = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  shift: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" strokeLinecap="round" />
    </svg>
  ),
  reservation: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4.5" width="18" height="16.5" rx="2" />
      <path d="M3 9.5h18M8 2.5v4M16 2.5v4" strokeLinecap="round" />
    </svg>
  ),
  customer: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="8" r="3.8" />
      <path d="M4.5 20.5c0-4 3.4-6.2 7.5-6.2s7.5 2.2 7.5 6.2" strokeLinecap="round" />
    </svg>
  ),
  inventory: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 7.5l9-4.5 9 4.5v9l-9 4.5-9-4.5z" strokeLinejoin="round" />
      <path d="M3 7.5l9 4.5 9-4.5M12 12v9" strokeLinejoin="round" />
    </svg>
  ),
  access: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 20V11M10 20V5M16 20v-6M22 20H2" strokeLinecap="round" />
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 7h10M18 7h2M4 17h2M10 17h10" strokeLinecap="round" />
      <circle cx="16" cy="7" r="2.4" />
      <circle cx="8" cy="17" r="2.4" />
    </svg>
  ),
};

export function Sidebar() {
  const pathname = usePathname();
  const { t, lang, setLang } = useLang();
  const activeKey = navItemForPath(pathname).key;

  const langBtn = (active: boolean): React.CSSProperties => ({
    border: 'none',
    cursor: 'pointer',
    borderRadius: 999,
    padding: '6px 14px',
    font: '600 11.5px var(--ui)',
    flex: 1,
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#fff' : 'var(--ink2)',
    transition: 'background .15s, color .15s',
  });

  return (
    <aside
      style={{
        width: 248,
        flex: 'none',
        background: '#FBF9F5',
        borderRight: '1px solid var(--line)',
        display: 'flex',
        flexDirection: 'column',
        padding: '28px 18px',
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, padding: '0 10px 28px' }}>
        <span style={{ fontFamily: 'var(--ui)', fontSize: 19, fontWeight: 700, letterSpacing: 1.5, color: 'var(--ink)' }}>HUMAN-HUB</span>
        <span style={{ fontSize: 9, letterSpacing: 2.5, color: 'var(--ink3)', textTransform: 'uppercase' }}>Salon</span>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {NAV.map((item) => {
          const active = item.key === activeKey;
          return (
            <Link
              key={item.key}
              href={item.href}
              className="nav-item"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                padding: '9px 12px',
                border: 'none',
                borderRadius: 9,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                font: '500 13.5px var(--ui)',
                textDecoration: 'none',
                transition: 'background .15s, color .15s',
                background: active ? 'var(--accent-soft)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--ink2)',
                fontWeight: active ? 600 : 500,
              }}
            >
              <span style={{ display: 'flex', color: active ? 'var(--accent)' : 'inherit' }}>{icons[item.key]}</span>
              <span>{t[item.labelKey]}</span>
              {item.pro && (
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: 8.5,
                    fontWeight: 700,
                    letterSpacing: 0.6,
                    padding: '2px 6px',
                    borderRadius: 5,
                    background: '#BFA06A',
                    color: '#fff',
                  }}
                >
                  {t.accBadge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', background: '#fff', border: '1px solid var(--line)', borderRadius: 999, padding: 3 }}>
          <button onClick={() => setLang('ja')} style={langBtn(lang === 'ja')}>日本語</button>
          <button onClick={() => setLang('en')} style={langBtn(lang === 'en')}>EN</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '16px 10px 8px', borderTop: '1px solid var(--line)' }}>
          <div
            style={{
              width: 36,
              height: 36,
              flex: 'none',
              borderRadius: '50%',
              background: 'var(--accent)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--serif)',
              fontSize: 18,
            }}
          >
            Y
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Yuki Tanaka</div>
            <div style={{ fontSize: 11, color: 'var(--ink3)' }}>{t.roleOwner}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
