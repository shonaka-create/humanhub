'use client';

import { useLang } from '@/i18n/LangProvider';
import type { MyPayslip } from '@/lib/data';

/** 円表記（例: ¥1,200）。 */
function yen(n: number): string {
  return `¥${Math.round(n).toLocaleString('ja-JP')}`;
}

const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function StaffPayrollView({ slips, linked }: { slips: MyPayslip[]; linked: boolean }) {
  const { t, lang } = useLang();

  const periodLabel = (period: string) => {
    const [y, m] = period.split('-').map(Number);
    return lang === 'ja' ? `${y}年${m}月` : `${EN_MONTHS[m - 1]} ${y}`;
  };

  return (
    <>
      <div className="toolbar" style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 600 }}>{t.payrollMyTitle}</div>
        <div style={{ fontSize: 12, color: 'var(--ink2)', marginTop: 3 }}>{t.payrollMyDesc}</div>
      </div>

      {!linked ? (
        <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: '44px 24px', textAlign: 'center', color: 'var(--ink2)', fontSize: 13, lineHeight: 1.7 }}>
          {t.payrollNotLinked}
        </div>
      ) : slips.length === 0 ? (
        <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: '44px 24px', textAlign: 'center', color: 'var(--ink3)', fontSize: 13 }}>
          {t.payrollNoSlips}
        </div>
      ) : (
        <div className="grid-cards-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 18 }}>
          {slips.map((s) => {
            const confirmed = s.status === 'confirmed';
            return (
              <div key={s.period} style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 2px rgba(46,42,37,.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 600 }}>{periodLabel(s.period)}</span>
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: 10.5,
                      fontWeight: 700,
                      letterSpacing: 0.4,
                      padding: '3px 10px',
                      borderRadius: 999,
                      background: confirmed ? 'var(--sage-soft)' : 'var(--accent-soft)',
                      color: confirmed ? 'var(--sage)' : 'var(--accent)',
                    }}
                  >
                    {confirmed ? t.payrollConfirmed : t.payrollEstimate}
                  </span>
                </div>

                <div style={{ fontSize: 11.5, color: 'var(--ink2)' }}>{t.payrollNet}</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 30, fontWeight: 600, lineHeight: 1, margin: '4px 0 16px' }}>{yen(s.net)}</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5 }}>
                  <Line label={`${t.shiftWorked}`} value={`${(s.workedMin / 60).toFixed(1)}h`} muted />
                  <Line label={t.payrollBase} value={yen(s.basePay)} />
                  <Line label={t.payrollAllowance} value={yen(s.allowance)} />
                  {s.adjustment !== 0 && <Line label={t.payrollAdjustment} value={yen(s.adjustment)} color="var(--sage)" />}
                  {s.deduction !== 0 && <Line label={t.payrollDeduction} value={`-${yen(s.deduction)}`} color="var(--rose)" />}
                  <div style={{ borderTop: '1px solid var(--line)', margin: '4px 0' }} />
                  <Line label={t.payrollGross} value={yen(s.gross)} muted />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function Line({ label, value, muted, color }: { label: string; value: string; muted?: boolean; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline' }}>
      <span style={{ color: 'var(--ink3)' }}>{label}</span>
      <span style={{ marginLeft: 'auto', fontWeight: 500, color: color ?? (muted ? 'var(--ink2)' : 'var(--ink)') }}>{value}</span>
    </div>
  );
}
