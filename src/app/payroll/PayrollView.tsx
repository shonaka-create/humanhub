'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLang } from '@/i18n/LangProvider';
import { Avatar } from '@/components/ui';
import { Field, FieldRow, FormActions, Modal, TextInput } from '@/components/Modal';
import { confirmPayroll, reopenPayroll, runPayroll, updatePayslip, upsertPayRate } from '@/lib/actions';
import type { PayRateRow, PayrollRunData, PayslipRow } from '@/lib/data';

/** 円表記（例: ¥1,200）。 */
function yen(n: number): string {
  return `¥${Math.round(n).toLocaleString('ja-JP')}`;
}
function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const SLIP_COLS = '1.4fr 0.7fr 1fr 0.9fr 0.9fr 0.9fr 1fr';

export function PayrollView({
  rows,
  isOwner,
  tab,
  month,
  run,
}: {
  rows: PayRateRow[];
  isOwner: boolean;
  tab: 'rates' | 'run';
  month: string;
  run: PayrollRunData | null;
}) {
  const { t } = useLang();
  const router = useRouter();
  const [editing, setEditing] = useState<PayRateRow | null>(null);
  const [adjusting, setAdjusting] = useState<PayslipRow | null>(null);
  const [pending, start] = useTransition();

  if (!isOwner) {
    return (
      <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: '48px 24px', textAlign: 'center', color: 'var(--ink2)', fontSize: 14 }}>
        {t.payrollOwnerOnly}
      </div>
    );
  }

  const confirmed = run?.status === 'confirmed';

  function saveRate(formData: FormData) {
    start(async () => {
      await upsertPayRate(formData);
      setEditing(null);
    });
  }
  function saveSlip(formData: FormData) {
    start(async () => {
      await updatePayslip(formData);
      setAdjusting(null);
    });
  }
  function calc() {
    start(async () => {
      const fd = new FormData();
      fd.set('period', month);
      await runPayroll(fd);
    });
  }
  function setConfirmed(confirm: boolean) {
    start(async () => {
      const fd = new FormData();
      fd.set('period', month);
      await (confirm ? confirmPayroll(fd) : reopenPayroll(fd));
    });
  }

  const tabBtn = (active: boolean): React.CSSProperties => ({
    font: '600 12.5px var(--ui)',
    border: 'none',
    borderRadius: 999,
    padding: '8px 18px',
    cursor: 'pointer',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#fff' : 'var(--ink2)',
    whiteSpace: 'nowrap',
  });

  return (
    <>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 5, background: '#FBF9F5', border: '1px solid var(--line)', borderRadius: 999, padding: 4, marginBottom: 20, width: 'fit-content' }}>
        <button onClick={() => router.push('/payroll?tab=rates')} style={tabBtn(tab === 'rates')}>{t.payrollTabRates}</button>
        <button onClick={() => router.push(`/payroll?tab=run&month=${month}`)} style={tabBtn(tab === 'run')}>{t.payrollTabRun}</button>
      </div>

      {tab === 'rates' ? (
        <RatesTab rows={rows} onEdit={setEditing} t={t} />
      ) : (
        <RunTab
          run={run}
          month={month}
          confirmed={confirmed}
          pending={pending}
          onMonth={(m) => router.push(`/payroll?tab=run&month=${m}`)}
          onCalc={calc}
          onConfirm={() => setConfirmed(true)}
          onReopen={() => setConfirmed(false)}
          onAdjust={setAdjusting}
          t={t}
        />
      )}

      {/* Rate edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={t.payrollEditTitle}>
        {editing && (
          <form action={saveRate}>
            <input type="hidden" name="staff_id" value={editing.staff.id} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <Avatar initial={editing.staff.initial} tone={editing.staff.tone} size={30} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>{editing.staff.name}</span>
            </div>
            <Field label={t.payrollEffectiveFrom}>
              <TextInput type="date" name="effective_from" required defaultValue={editing.current?.effectiveFrom ?? todayStr()} />
            </Field>
            <Field label={`${t.payrollHourly}（¥）`}>
              <TextInput type="number" name="hourly_wage" min={0} step={10} required defaultValue={editing.current?.hourlyWage ?? 0} />
            </Field>
            <FieldRow>
              <Field label={`${t.payrollCommute}（¥）`}>
                <TextInput type="number" name="commute_allowance" min={0} step={100} defaultValue={editing.current?.commuteAllowance ?? 0} />
              </Field>
              <Field label={`${t.payrollOther}（¥）`}>
                <TextInput type="number" name="other_allowance" min={0} step={100} defaultValue={editing.current?.otherAllowance ?? 0} />
              </Field>
            </FieldRow>
            <Field label={t.formNote}>
              <TextInput name="note" defaultValue={editing.current?.note ?? ''} placeholder={t.formNote} />
            </Field>
            <FormActions cancelLabel={t.formCancel} saveLabel={t.formSave} onCancel={() => setEditing(null)} pending={pending} />
          </form>
        )}
      </Modal>

      {/* Payslip adjust modal */}
      <Modal open={!!adjusting} onClose={() => setAdjusting(null)} title={t.payrollAdjustTitle}>
        {adjusting && (
          <form action={saveSlip}>
            <input type="hidden" name="payslip_id" value={adjusting.payslipId} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Avatar initial={adjusting.staff.initial} tone={adjusting.staff.tone} size={30} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>{adjusting.staff.name}</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink3)', marginBottom: 14 }}>{t.payrollAdjustHint}</div>
            <FieldRow>
              <Field label={`${t.payrollAdjustment}（¥）`}>
                <TextInput type="number" name="adjustment" step={100} defaultValue={adjusting.adjustment} />
              </Field>
              <Field label={`${t.payrollDeduction}（¥）`}>
                <TextInput type="number" name="deduction" step={100} defaultValue={adjusting.deduction} />
              </Field>
            </FieldRow>
            <FormActions cancelLabel={t.formCancel} saveLabel={t.formSave} onCancel={() => setAdjusting(null)} pending={pending} />
          </form>
        )}
      </Modal>
    </>
  );
}

function RatesTab({ rows, onEdit, t }: { rows: PayRateRow[]; onEdit: (r: PayRateRow) => void; t: ReturnType<typeof useLang>['t'] }) {
  return (
    <>
      <div className="toolbar" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 600 }}>{t.payrollTitle}</div>
          <div style={{ fontSize: 12, color: 'var(--ink2)', marginTop: 3 }}>{t.payrollDesc}</div>
        </div>
      </div>
      <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: '8px 24px 16px', boxShadow: '0 1px 2px rgba(46,42,37,.04)' }}>
        {rows.map((row, idx) => {
          const rate = row.current;
          const allowance = rate ? rate.commuteAllowance + rate.otherAllowance : 0;
          return (
            <div key={row.staff.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 0', borderBottom: idx === rows.length - 1 ? 'none' : '1px solid var(--line)' }}>
              <Avatar initial={row.staff.initial} tone={row.staff.tone} size={38} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{row.staff.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink3)' }}>{rate ? `${t.payrollAppliedFrom} ${rate.effectiveFrom}` : t.payrollNoRate}</div>
              </div>
              {rate ? (
                <div style={{ textAlign: 'right', marginRight: 4 }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 600 }}>
                    {yen(rate.hourlyWage)}<span style={{ fontSize: 11, color: 'var(--ink3)', fontFamily: 'var(--ui)' }}> {t.payrollPerHour}</span>
                  </div>
                  {allowance > 0 && <div style={{ fontSize: 11, color: 'var(--ink3)' }}>{t.payrollAllowance} {yen(allowance)}</div>}
                </div>
              ) : (
                <span style={{ fontSize: 12, color: 'var(--ink3)', marginRight: 4 }}>{t.payrollNoRate}</span>
              )}
              <button
                onClick={() => onEdit(row)}
                style={{ font: '600 12px var(--ui)', background: rate ? '#fff' : 'var(--accent)', color: rate ? 'var(--accent)' : '#fff', border: rate ? '1px solid var(--accent)' : 'none', borderRadius: 999, padding: '8px 16px', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {rate ? t.payrollSet : `＋ ${t.payrollSet}`}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}

function RunTab({
  run,
  month,
  confirmed,
  pending,
  onMonth,
  onCalc,
  onConfirm,
  onReopen,
  onAdjust,
  t,
}: {
  run: PayrollRunData | null;
  month: string;
  confirmed: boolean;
  pending: boolean;
  onMonth: (m: string) => void;
  onCalc: () => void;
  onConfirm: () => void;
  onReopen: () => void;
  onAdjust: (s: PayslipRow) => void;
  t: ReturnType<typeof useLang>['t'];
}) {
  const badge = (bg: string, color: string, label: string) => (
    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, padding: '4px 11px', borderRadius: 999, background: bg, color }}>{label}</span>
  );

  return (
    <>
      <div className="toolbar" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--ink3)' }}>{t.payrollMonth}</span>
        <input
          type="month"
          value={month}
          onChange={(e) => e.target.value && onMonth(e.target.value)}
          style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '8px 12px', font: '13px var(--ui)', background: '#FBF9F5', color: 'var(--ink)' }}
        />
        {run && (confirmed ? badge('var(--sage-soft)', 'var(--sage)', t.payrollConfirmed) : badge('var(--accent-soft)', 'var(--accent)', t.payrollDraft))}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          {!confirmed && (
            <button onClick={onCalc} disabled={pending} style={{ font: '600 12.5px var(--ui)', background: '#fff', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: 999, padding: '9px 18px', cursor: pending ? 'default' : 'pointer', whiteSpace: 'nowrap', opacity: pending ? 0.7 : 1 }}>
              {pending ? `⟳ ${t.payrollCalculating}` : `↻ ${run ? t.payrollRecalc : t.payrollCalc}`}
            </button>
          )}
          {run && !confirmed && (
            <button onClick={onConfirm} disabled={pending} style={{ font: '600 12.5px var(--ui)', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 999, padding: '9px 18px', cursor: pending ? 'default' : 'pointer', whiteSpace: 'nowrap', opacity: pending ? 0.7 : 1 }}>
              {pending ? t.payrollConfirming : t.payrollConfirm}
            </button>
          )}
          {run && confirmed && (
            <button onClick={onReopen} disabled={pending} style={{ font: '600 12.5px var(--ui)', background: '#fff', color: 'var(--ink2)', border: '1px solid var(--line)', borderRadius: 999, padding: '9px 18px', cursor: pending ? 'default' : 'pointer', whiteSpace: 'nowrap' }}>
              {t.payrollReopen}
            </button>
          )}
        </div>
      </div>

      {confirmed && (
        <div style={{ fontSize: 12, color: 'var(--sage)', background: 'var(--sage-soft)', border: '1px solid var(--sage)', borderRadius: 12, padding: '10px 14px', marginBottom: 16 }}>
          🔒 {t.payrollLockedNote}
        </div>
      )}

      {!run ? (
        <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: '44px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--ink2)', marginBottom: 18, lineHeight: 1.7 }}>{t.payrollNotRun}</div>
          <button onClick={onCalc} disabled={pending} style={{ font: '700 13.5px var(--ui)', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 999, padding: '12px 26px', cursor: pending ? 'default' : 'pointer', opacity: pending ? 0.7 : 1 }}>
            {pending ? `⟳ ${t.payrollCalculating}` : `↻ ${t.payrollCalc}`}
          </button>
        </div>
      ) : (
        <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px 16px', boxShadow: '0 1px 2px rgba(46,42,37,.04)' }}>
          <div className="scroll-x">
            <div style={{ minWidth: 680 }}>
              <div style={{ display: 'grid', gridTemplateColumns: SLIP_COLS, gap: 12, padding: '10px 0', fontSize: 11, letterSpacing: 0.4, color: 'var(--ink2)', textTransform: 'uppercase', borderBottom: '1px solid var(--line)' }}>
                <div>{t.staffCol}</div>
                <div style={{ textAlign: 'right' }}>{t.shiftWorked}</div>
                <div style={{ textAlign: 'right' }}>{t.payrollBase}</div>
                <div style={{ textAlign: 'right' }}>{t.payrollAllowance}</div>
                <div style={{ textAlign: 'right' }}>{t.payrollAdjustment}</div>
                <div style={{ textAlign: 'right' }}>{t.payrollDeduction}</div>
                <div style={{ textAlign: 'right' }}>{t.payrollNet}</div>
              </div>

              {run.slips.map((s) => (
                <div key={s.payslipId} style={{ display: 'grid', gridTemplateColumns: SLIP_COLS, gap: 12, padding: '13px 0', alignItems: 'center', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                    <Avatar initial={s.staff.initial} tone={s.staff.tone} size={26} />
                    <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.staff.name}</span>
                  </div>
                  <div style={{ textAlign: 'right', color: 'var(--ink2)' }}>{(s.workedMin / 60).toFixed(1)}h</div>
                  <div style={{ textAlign: 'right' }}>{yen(s.basePay)}</div>
                  <div style={{ textAlign: 'right', color: 'var(--ink2)' }}>{yen(s.allowance)}</div>
                  <div style={{ textAlign: 'right', color: s.adjustment ? 'var(--sage)' : 'var(--ink3)' }}>{s.adjustment ? yen(s.adjustment) : '—'}</div>
                  <div style={{ textAlign: 'right', color: s.deduction ? 'var(--rose)' : 'var(--ink3)' }}>{s.deduction ? `-${yen(s.deduction)}` : '—'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--serif)', fontWeight: 600, fontSize: 15 }}>{yen(s.net)}</span>
                    {!confirmed && (
                      <button onClick={() => onAdjust(s)} style={{ font: '600 10.5px var(--ui)', background: '#fff', color: 'var(--ink2)', border: '1px solid var(--line)', borderRadius: 999, padding: '4px 10px', cursor: 'pointer' }}>
                        {t.payrollEditSlip}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <div style={{ display: 'grid', gridTemplateColumns: SLIP_COLS, gap: 12, padding: '14px 0 4px', alignItems: 'center', fontSize: 13 }}>
                <div style={{ fontWeight: 600 }}>{t.payrollTotal}</div>
                <div /><div /><div /><div />
                <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--ink3)' }}>{t.payrollGross} {yen(run.totalGross)}</div>
                <div style={{ textAlign: 'right', fontFamily: 'var(--serif)', fontWeight: 700, fontSize: 17 }}>{yen(run.totalNet)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
