'use client';

import { useLang } from '@/i18n/LangProvider';
import { toneStyles } from '@/lib/tones';
import { bookingBlocks, bookingHours, bookingStaff } from '@/lib/mock';

export default function BookingsPage() {
  const { t } = useLang();

  const navBtn: React.CSSProperties = {
    width: 32,
    height: 32,
    border: '1px solid var(--line)',
    background: '#fff',
    borderRadius: '50%',
    cursor: 'pointer',
    color: 'var(--ink2)',
    fontSize: 14,
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
        <button style={navBtn}>‹</button>
        <span style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 600 }}>{t.resDay}</span>
        <button style={navBtn}>›</button>
        <button style={{ font: '500 12px var(--ui)', border: '1px solid var(--line)', background: '#fff', borderRadius: 999, padding: '6px 14px', cursor: 'pointer', color: 'var(--ink2)' }}>{t.today}</button>
        <button style={{ marginLeft: 'auto', font: '600 12.5px var(--ui)', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 999, padding: '9px 18px', cursor: 'pointer' }}>＋ {t.newBooking}</button>
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 2px rgba(46,42,37,.04)', overflow: 'hidden' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '60px repeat(4,1fr)',
            gap: '0 6px',
            gridTemplateRows: '42px repeat(22,26px)',
            position: 'relative',
          }}
        >
          {/* Staff column headers */}
          <div style={{ gridColumn: 1, gridRow: 1 }} />
          {bookingStaff.map((s, i) => (
            <div key={s.initial} style={{ gridColumn: i + 2, gridRow: 1, display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 8 }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: toneStyles[s.tone].soft,
                  color: toneStyles[s.tone].strong,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--serif)',
                  fontSize: 12,
                }}
              >
                {s.initial}
              </div>
              <span style={{ fontSize: 12.5, fontWeight: 500 }}>{s.name}</span>
            </div>
          ))}

          {/* Horizontal hour gridlines */}
          {bookingHours.map((_, i) => (
            <div key={`line-${i}`} style={{ gridColumn: '1 / -1', gridRow: 2 + i * 2, borderTop: '1px solid var(--line)' }} />
          ))}

          {/* Hour labels */}
          {bookingHours.map((h, i) => (
            <div key={`hr-${h}`} style={{ gridColumn: 1, gridRow: 2 + i * 2, fontSize: 10.5, color: 'var(--ink3)', transform: 'translateY(-7px)' }}>
              {h}
            </div>
          ))}

          {/* Appointment blocks */}
          {bookingBlocks.map((b) => {
            const ts = toneStyles[b.tone];
            return (
              <div
                key={b.id}
                style={{
                  gridColumn: b.col + 1,
                  gridRow: `${b.rowStart} / span ${b.rowSpan}`,
                  background: ts.soft,
                  borderLeft: `3px solid ${ts.strong}`,
                  borderRadius: 7,
                  padding: '5px 8px',
                  margin: 2,
                  overflow: 'hidden',
                }}
              >
                <div style={{ fontSize: 10, color: ts.darkText }}>{b.time}</div>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{b.customer}</div>
                {b.serviceKey && <div style={{ fontSize: 10.5, color: 'var(--ink2)' }}>{t[b.serviceKey]}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
