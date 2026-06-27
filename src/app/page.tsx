'use client';

import { useLang } from '@/i18n/LangProvider';
import { Avatar, Card } from '@/components/ui';
import { toneStyles } from '@/lib/tones';
import {
  dashboardMetrics as m,
  followUps,
  stockAlerts,
  todaySchedule,
} from '@/lib/mock';

export default function DashboardPage() {
  const { t } = useLang();

  return (
    <>
      <div style={{ marginBottom: 26 }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 31, fontWeight: 600, lineHeight: 1.1 }}>{t.greeting}</div>
        <div style={{ color: 'var(--ink2)', fontSize: 13, marginTop: 5 }}>{t.greetingSub}</div>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18, marginBottom: 24 }}>
        <Metric label={t.mToday} value={m.todayBookings} unit={t.uCases} foot={`▲ ${m.todayBookingsDelta}`} footColor="var(--sage)" />
        <Metric label={t.mStaff} value={m.staffOnShift} unit={t.uPeople} foot={`/ ${m.staffTotal}`} footColor="var(--ink3)" />
        <Metric label={t.mFollow} value={m.needsFollow} unit={t.uPeople} foot={t.followDesc} valueColor="var(--accent)" footColor="var(--accent)" />
        <Metric label={t.mStock} value={m.lowStock} unit={t.uItems} foot={t.needOrder} valueColor="var(--rose)" footColor="var(--rose)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 22 }}>
        {/* Today's schedule */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 19, fontWeight: 600, margin: 0 }}>{t.secSchedule}</h2>
            <a style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--accent)', textDecoration: 'none', cursor: 'pointer' }}>{t.viewAll}</a>
          </div>
          {todaySchedule.map((s) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0', borderTop: '1px solid var(--line)', marginTop: 8 }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 18, width: 50 }}>{s.time}</div>
              <div style={{ width: 3, height: 36, borderRadius: 3, background: toneStyles[s.tone].strong }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{s.customer}</div>
                <div style={{ fontSize: 12, color: 'var(--ink2)' }}>{t[s.serviceKey]}・{s.durationMin}min</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar initial={s.staffInitial} tone={s.tone} size={28} />
                <span style={{ fontSize: 12, color: 'var(--ink2)' }}>{s.staffName}</span>
              </div>
            </div>
          ))}
        </Card>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <Card>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 19, fontWeight: 600, margin: '0 0 2px' }}>{t.secFollow}</h2>
            <div style={{ fontSize: 11.5, color: 'var(--ink2)', marginBottom: 6 }}>{t.followDesc}</div>
            {followUps.map((f) => {
              const sent = f.status === 'sent';
              const ts = sent ? toneStyles.sage : toneStyles.accent;
              return (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', borderTop: '1px solid var(--line)', marginTop: 8 }}>
                  <Avatar initial={f.initial} tone={f.tone} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{f.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink2)' }}>{t.firstVisit} · {f.firstVisitDate}</div>
                  </div>
                  <span style={{ fontSize: 10.5, padding: '3px 9px', borderRadius: 999, background: ts.soft, color: ts.strong, whiteSpace: 'nowrap' }}>
                    {sent ? t.stSent : t.stSend}
                  </span>
                </div>
              );
            })}
          </Card>

          <Card>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 19, fontWeight: 600, margin: '0 0 10px' }}>{t.secStock}</h2>
            {stockAlerts.map((a) => (
              <div key={a.id} style={{ padding: '12px 0', borderTop: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 500 }}>{a.nameKey ? t[a.nameKey] : ''} {a.name ?? ''}</span>
                  <button style={{ marginLeft: 'auto', font: '600 11px var(--ui)', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 999, padding: '5px 13px', cursor: 'pointer' }}>
                    {t.btnReorder}
                  </button>
                </div>
                <div style={{ height: 6, borderRadius: 6, background: 'var(--rose-soft)', overflow: 'hidden' }}>
                  <div style={{ width: `${a.pct}%`, height: '100%', background: 'var(--rose)' }} />
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </>
  );
}

function Metric({
  label,
  value,
  unit,
  foot,
  valueColor,
  footColor,
}: {
  label: string;
  value: number | string;
  unit: string;
  foot: string;
  valueColor?: string;
  footColor: string;
}) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 15, padding: '18px 20px', boxShadow: '0 1px 2px rgba(46,42,37,.04)' }}>
      <div style={{ fontSize: 12, color: 'var(--ink2)' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 8 }}>
        <span style={{ fontFamily: 'var(--serif)', fontSize: 42, fontWeight: 600, lineHeight: 0.9, color: valueColor }}>{value}</span>
        <span style={{ fontSize: 12, color: 'var(--ink3)' }}>{unit}</span>
      </div>
      <div style={{ fontSize: 11.5, color: footColor, marginTop: 9 }}>{foot}</div>
    </div>
  );
}
