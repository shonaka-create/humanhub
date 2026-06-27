'use client';

import { useLang } from '@/i18n/LangProvider';

export default function SettingsPage() {
  const { t } = useLang();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: 'var(--ink3)', textAlign: 'center' }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
        <path d="M4 7h10M18 7h2M4 17h2M10 17h10" strokeLinecap="round" />
        <circle cx="16" cy="7" r="2.4" />
        <circle cx="8" cy="17" r="2.4" />
      </svg>
      <div style={{ marginTop: 14, fontSize: 14 }}>{t.settingsPlaceholder}</div>
    </div>
  );
}
