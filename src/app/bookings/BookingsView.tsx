'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLang } from '@/i18n/LangProvider';
import { Field, FieldRow, FormActions, Modal, Select, TextInput } from '@/components/Modal';
import { toneStyles } from '@/lib/tones';
import { createBooking } from '@/lib/actions';
import { SERVICE_KEYS } from '@/lib/formOptions';
import type { BookingBlock, Staff, Tone } from '@/lib/types';

const BOOKING_HOURS = ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const JA_WD = ['日', '月', '火', '水', '木', '金', '土'];
const EN_WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** YYYY-MM-DD（ローカル日付）。フォームの初期値に使う。 */
function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 'YYYY-MM-DD' をローカル Date に。 */
function parseYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function BookingsView({
  date,
  staff,
  blocks,
  staffOptions,
  selectedStaffId,
}: {
  date: string;
  staff: { initial: string; name: string; tone: Tone; unassigned?: boolean }[];
  blocks: BookingBlock[];
  staffOptions: Staff[];
  selectedStaffId: string;
}) {
  const { t, lang } = useLang();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const current = parseYmd(date);
  const isToday = date === todayStr();
  // 日付・スタッフフィルタを保ったまま遷移する。
  const urlFor = (d: string, staffId: string) =>
    `/bookings?date=${d}${staffId ? `&staff=${staffId}` : ''}`;
  const goTo = (d: Date) => router.push(urlFor(ymd(d), selectedStaffId));
  const shiftDay = (delta: number) => {
    const d = new Date(current);
    d.setDate(d.getDate() + delta);
    goTo(d);
  };
  const dayLabel =
    lang === 'ja'
      ? `${current.getMonth() + 1}月${current.getDate()}日（${JA_WD[current.getDay()]}）`
      : `${EN_WD[current.getDay()]}, ${current.getDate()} ${EN_MONTHS[current.getMonth()]}`;

  function submit(formData: FormData) {
    start(async () => {
      await createBooking(formData);
      setOpen(false);
    });
  }

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

  const colCount = Math.max(staff.length, 1);

  return (
    <>
      <div className="toolbar" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
        <button onClick={() => shiftDay(-1)} style={navBtn} aria-label="previous day">‹</button>
        <span style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 600 }}>{dayLabel}</span>
        <button onClick={() => shiftDay(1)} style={navBtn} aria-label="next day">›</button>
        <button onClick={() => goTo(new Date())} style={{ font: '500 12px var(--ui)', border: '1px solid var(--line)', background: isToday ? 'var(--accent-soft)' : '#fff', borderRadius: 999, padding: '6px 14px', cursor: 'pointer', color: isToday ? 'var(--accent)' : 'var(--ink2)' }}>{t.today}</button>

        {/* 表示フィルタ: 店舗全体 or 登録スタッフ別 */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--ink3)', whiteSpace: 'nowrap' }}>{t.bookingFilterLabel}</span>
          <select
            value={selectedStaffId}
            onChange={(e) => router.push(urlFor(date, e.target.value))}
            style={{ border: '1px solid var(--line)', borderRadius: 999, padding: '7px 12px', font: '500 12.5px var(--ui)', color: 'var(--ink)', background: '#fff', cursor: 'pointer' }}
          >
            <option value="">{t.bookingAllStaff}</option>
            {staffOptions.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <button onClick={() => setOpen(true)} style={{ font: '600 12.5px var(--ui)', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 999, padding: '9px 18px', cursor: 'pointer' }}>＋ {t.newBooking}</button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={t.addBookingTitle}>
        <form action={submit}>
          <Field label={t.formCustomer}><TextInput name="customer_name" required placeholder={t.formCustomer} /></Field>
          <FieldRow>
            <Field label={t.formDate}><TextInput type="date" name="booking_date" required defaultValue={date} /></Field>
            <Field label={t.formTime}><TextInput type="time" name="start_time" required defaultValue="10:00" /></Field>
          </FieldRow>
          <FieldRow>
            <Field label={t.formStaff}>
              <Select name="staff_id" defaultValue="">
                <option value="">{t.formNone}</option>
                {staffOptions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </Field>
            <Field label={t.formDuration}><TextInput type="number" name="duration_min" min={15} step={15} defaultValue={60} /></Field>
          </FieldRow>
          <Field label={t.formService}>
            <Select name="service_key" defaultValue="svcCut">
              {SERVICE_KEYS.map((k) => (
                <option key={k} value={k}>{t[k]}</option>
              ))}
            </Select>
          </Field>
          <FormActions cancelLabel={t.formCancel} saveLabel={t.formSave} onCancel={() => setOpen(false)} pending={pending} />
        </form>
      </Modal>

      <div className="scroll-x" style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 2px rgba(46,42,37,.04)' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `60px repeat(${colCount},minmax(110px,1fr))`,
            gap: '0 6px',
            gridTemplateRows: '42px repeat(22,26px)',
            position: 'relative',
            minWidth: 60 + colCount * 110,
          }}
        >
          {/* Staff column headers */}
          <div style={{ gridColumn: 1, gridRow: 1 }} />
          {staff.map((s, i) => (
            <div key={`${s.initial}-${i}`} style={{ gridColumn: i + 2, gridRow: 1, display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 8 }}>
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
              <span style={{ fontSize: 12.5, fontWeight: 500, color: s.unassigned ? 'var(--ink3)' : undefined }}>{s.unassigned ? t.bookingUnassigned : s.name}</span>
            </div>
          ))}

          {/* Horizontal hour gridlines (start after the hour-label gutter) */}
          {BOOKING_HOURS.map((_, i) => (
            <div key={`line-${i}`} style={{ gridColumn: '2 / -1', gridRow: 2 + i * 2, borderTop: '1px solid var(--line)' }} />
          ))}

          {/* Hour labels */}
          {BOOKING_HOURS.map((h, i) => (
            <div key={`hr-${h}`} style={{ gridColumn: 1, gridRow: 2 + i * 2, fontSize: 10.5, color: 'var(--ink3)', transform: 'translateY(-7px)', paddingRight: 8, whiteSpace: 'nowrap' }}>
              {h}
            </div>
          ))}

          {/* Appointment blocks */}
          {blocks.map((b) => {
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
