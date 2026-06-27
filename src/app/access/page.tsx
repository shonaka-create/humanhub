'use client';

import { useLang } from '@/i18n/LangProvider';
import { accessStats } from '@/lib/mock';

export default function AccessPage() {
  const { t } = useLang();

  return (
    <div style={{ position: 'relative', minHeight: 560 }}>
      {/* Blurred preview behind the upsell */}
      <div style={{ filter: 'blur(5px)', opacity: 0.5, pointerEvents: 'none', userSelect: 'none' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.6"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" /></svg>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{t.accWeb}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink2)' }}>{t.accVisits}</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 42, fontWeight: 600, lineHeight: 1, margin: '4px 0 18px' }}>{accessStats.webVisits}</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 90 }}>
              {accessStats.webBars.map((h, i) => (
                <div key={i} style={{ flex: 1, height: `${h}%`, background: h >= 90 ? 'var(--accent)' : 'var(--accent-soft)', borderRadius: 5 }} />
              ))}
            </div>
          </div>
          <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--rose)" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" /></svg>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{t.accIg}</span>
            </div>
            <div style={{ display: 'flex', gap: 28 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--ink2)' }}>{t.accFollowers}</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 42, fontWeight: 600, lineHeight: 1, marginTop: 4 }}>{accessStats.followers}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--ink2)' }}>{t.accReach}</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 42, fontWeight: 600, lineHeight: 1, marginTop: 4 }}>{accessStats.reach}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 90, marginTop: 18 }}>
              {accessStats.igBars.map((h, i) => (
                <div key={i} style={{ flex: 1, height: `${h}%`, background: h >= 84 ? 'var(--rose)' : 'var(--rose-soft)', borderRadius: 5 }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Upsell card */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 22, padding: '40px 42px', maxWidth: 460, textAlign: 'center', boxShadow: '0 24px 60px rgba(46,42,37,.14)' }}>
          <div style={{ width: 58, height: 58, borderRadius: '50%', background: '#F0E7D4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#BFA06A" strokeWidth="1.7"><rect x="4" y="10" width="16" height="11" rx="2.5" /><path d="M8 10V7a4 4 0 0 1 8 0v3" strokeLinecap="round" /></svg>
          </div>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 23, fontWeight: 600, margin: '0 0 10px' }}>{t.accLockedTitle}</h2>
          <p style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.6, margin: '0 0 22px' }}>{t.accLockedDesc}</p>
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 24 }}>
            {[t.accFeat1, t.accFeat2, t.accFeat3].map((f) => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#BFA06A" strokeWidth="2.4"><path d="M5 13l4 4 10-11" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span style={{ fontSize: 13 }}>{f}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 14, background: '#FBF9F5', borderRadius: 14, marginBottom: 18 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, padding: '3px 9px', borderRadius: 6, background: '#BFA06A', color: '#fff' }}>{t.accBadge}</span>
            <span style={{ fontSize: 13, color: 'var(--ink2)' }}>{t.accPlan}</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 30, fontWeight: 600 }}>{t.accPrice}</span>
              <span style={{ fontSize: 12, color: 'var(--ink3)' }}>{t.accPer}</span>
            </div>
          </div>
          <button style={{ width: '100%', font: '700 14px var(--ui)', background: '#BFA06A', color: '#fff', border: 'none', borderRadius: 999, padding: 14, cursor: 'pointer' }}>{t.accUpgrade}</button>
        </div>
      </div>
    </div>
  );
}
