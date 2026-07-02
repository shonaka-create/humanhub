'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLang } from '@/i18n/LangProvider';
import { Avatar } from '@/components/ui';
import { Field, FieldRow, FormActions, Modal, Select, TextInput } from '@/components/Modal';
import { toneStyles } from '@/lib/tones';
import { deleteShiftEntry, generateWeekFromTemplate, upsertShiftEntry } from '@/lib/actions';
import { SHIFT_STATUS_OPTIONS } from '@/lib/formOptions';
import type { CurrentStaff } from '@/lib/data';
import type { ShiftEntryCell, ShiftStatus, ShiftWeekRow, Staff } from '@/lib/types';

const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

/** 'YYYY-MM-DD' → ローカル Date（TZ ずれ防止）。 */
function parseYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function fmtYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}
/** 指定日を含む週の月曜。 */
function mondayOf(d: Date): Date {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  out.setDate(out.getDate() - ((out.getDay() + 6) % 7));
  return out;
}

type EditTarget = { staffId: string; staffName: string; date: string; cell: ShiftEntryCell };

export function ShiftsView({
  week,
  weekStart,
  staff: _staff,
  me,
}: {
  week: ShiftWeekRow[];
  weekStart: string;
  staff: Staff[];
  me: CurrentStaff | null;
}) {
  const { t, lang } = useLang();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [status, setStatus] = useState<ShiftStatus>('worked');

  const isOwner = me?.role === 'owner';
  const canEdit = (staffId: string) => isOwner || (!!me?.staffId && me.staffId === staffId);

  const weekStartDate = parseYmd(weekStart);
  const thisMonday = fmtYmd(mondayOf(new Date()));
  const isThisWeek = weekStart === thisMonday;

  const dayHeaders = DAY_KEYS.map((key, i) => {
    const d = addDays(weekStartDate, i);
    return {
      key,
      dateNum: d.getDate(),
      ymd: fmtYmd(d),
      color: i === 5 ? 'var(--accent)' : i === 6 ? 'var(--rose)' : undefined,
    };
  });

  const weekEnd = addDays(weekStartDate, 6);
  const weekLabel =
    lang === 'ja'
      ? `${weekStartDate.getMonth() + 1}月${weekStartDate.getDate()}日 – ${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`
      : `${EN_MONTHS[weekStartDate.getMonth()]} ${weekStartDate.getDate()} – ${EN_MONTHS[weekEnd.getMonth()]} ${weekEnd.getDate()}`;

  const goWeek = (monday: string) => router.push(`/shifts?week=${monday}`);

  function openCell(row: ShiftWeekRow, dayIdx: number) {
    if (!canEdit(row.staff.id)) return;
    const cell = row.days[dayIdx];
    setStatus(cell?.status ?? 'worked');
    setEditing({
      staffId: row.staff.id,
      staffName: row.staff.name,
      date: dayHeaders[dayIdx].ymd,
      cell,
    });
  }

  function submit(formData: FormData) {
    start(async () => {
      await upsertShiftEntry(formData);
      setEditing(null);
    });
  }
  function remove() {
    const id = editing?.cell?.id;
    if (!id) return;
    start(async () => {
      const fd = new FormData();
      fd.set('id', id);
      await deleteShiftEntry(fd);
      setEditing(null);
    });
  }
  function genWeek() {
    start(async () => {
      const fd = new FormData();
      fd.set('week_start', weekStart);
      await generateWeekFromTemplate(fd);
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

  const dateLabel =
    editing &&
    (lang === 'ja'
      ? `${parseYmd(editing.date).getMonth() + 1}月${parseYmd(editing.date).getDate()}日`
      : `${EN_MONTHS[parseYmd(editing.date).getMonth()]} ${parseYmd(editing.date).getDate()}`);

  return (
    <>
      <div className="toolbar" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
        <button onClick={() => goWeek(fmtYmd(addDays(weekStartDate, -7)))} style={navBtn} aria-label="previous week">‹</button>
        <span style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 600 }}>{weekLabel}</span>
        <button onClick={() => goWeek(fmtYmd(addDays(weekStartDate, 7)))} style={navBtn} aria-label="next week">›</button>
        <button
          onClick={() => router.push('/shifts')}
          style={{ font: '500 12px var(--ui)', border: '1px solid var(--line)', background: isThisWeek ? 'var(--accent-soft)' : '#fff', borderRadius: 999, padding: '6px 14px', cursor: 'pointer', color: isThisWeek ? 'var(--accent)' : 'var(--ink2)' }}
        >
          {t.today}
        </button>
        {isOwner && (
          <button
            onClick={genWeek}
            disabled={pending}
            style={{ marginLeft: 'auto', font: '600 12.5px var(--ui)', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 999, padding: '9px 18px', cursor: pending ? 'default' : 'pointer', opacity: pending ? 0.6 : 1, whiteSpace: 'nowrap' }}
          >
            ↻ {pending ? t.shiftGenerating : t.shiftGenerate}
          </button>
        )}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.cell ? t.shiftEditTitle : t.shiftAddTitle}>
        {editing && (
          <form action={submit}>
            <input type="hidden" name="staff_id" value={editing.staffId} />
            <input type="hidden" name="work_date" value={editing.date} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{editing.staffName}</span>
              <span style={{ fontSize: 12, color: 'var(--ink3)' }}>·</span>
              <span style={{ fontSize: 13, color: 'var(--ink2)' }}>{dateLabel}</span>
            </div>
            <Field label={t.formStatus}>
              <Select name="status" value={status} onChange={(e) => setStatus(e.target.value as ShiftStatus)}>
                {SHIFT_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{t[o.labelKey]}</option>
                ))}
              </Select>
            </Field>
            {status === 'worked' && (
              <>
                <FieldRow>
                  <Field label={t.formStart}><TextInput type="time" name="start_time" required defaultValue={editing.cell?.start ?? '09:00'} /></Field>
                  <Field label={t.formEnd}><TextInput type="time" name="end_time" required defaultValue={editing.cell?.end ?? '18:00'} /></Field>
                </FieldRow>
                <Field label={t.formBreak}><TextInput type="number" name="break_min" min={0} step={5} defaultValue={editing.cell?.breakMin ?? 0} /></Field>
              </>
            )}
            <Field label={t.formNote}><TextInput name="note" defaultValue={editing.cell?.note ?? ''} placeholder={t.formNote} /></Field>
            <FormActions cancelLabel={t.formCancel} saveLabel={t.formSave} onCancel={() => setEditing(null)} pending={pending} />
            {editing.cell && (
              <button
                type="button"
                onClick={remove}
                disabled={pending}
                style={{ width: '100%', marginTop: 10, font: '600 12.5px var(--ui)', background: '#fff', color: 'var(--rose)', border: '1px solid var(--rose)', borderRadius: 999, padding: 11, cursor: pending ? 'default' : 'pointer' }}
              >
                {t.shiftDelete}
              </button>
            )}
          </form>
        )}
      </Modal>

      <div className="scroll-x" style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: 22, boxShadow: '0 1px 2px rgba(46,42,37,.04)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '150px repeat(7,minmax(72px,1fr))', gap: 8, minWidth: 660 }}>
          <div />
          {dayHeaders.map((d) => (
            <div key={d.key} style={{ textAlign: 'center', paddingBottom: 8 }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 16, color: d.color }}>{t[d.key]}</div>
              <div style={{ fontSize: 12, color: d.color ?? 'var(--ink3)' }}>{d.dateNum}</div>
            </div>
          ))}

          {week.map((row) => {
            const editable = canEdit(row.staff.id);
            return (
              <Row key={row.staff.id} row={row} editable={editable} onCell={(i) => openCell(row, i)} t={t} />
            );
          })}
        </div>
      </div>
    </>
  );
}

function Row({
  row,
  editable,
  onCell,
  t,
}: {
  row: ShiftWeekRow;
  editable: boolean;
  onCell: (dayIdx: number) => void;
  t: ReturnType<typeof useLang>['t'];
}) {
  const hours = (row.workedMin / 60).toFixed(1);
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid var(--line)', paddingTop: 10 }}>
        <Avatar initial={row.staff.initial} tone={row.staff.tone} size={30} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.staff.name}</div>
          <div style={{ fontSize: 10.5, color: 'var(--ink3)' }}>{t.shiftWorked} {hours}h</div>
        </div>
      </div>
      {row.days.map((cell, i) => (
        <div key={i} style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>
          <Cell cell={cell} editable={editable} onClick={() => onCell(i)} t={t} />
        </div>
      ))}
    </>
  );
}

function Cell({
  cell,
  editable,
  onClick,
  t,
}: {
  cell: ShiftEntryCell;
  editable: boolean;
  onClick: () => void;
  t: ReturnType<typeof useLang>['t'];
}) {
  const base: React.CSSProperties = {
    borderRadius: 9,
    minHeight: 46,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 500,
    lineHeight: 1.35,
    cursor: editable ? 'pointer' : 'default',
    width: '100%',
    border: 'none',
    font: 'inherit',
    padding: '8px 4px',
  };

  // 空セル: 編集可なら ＋、不可なら休記号。
  if (!cell) {
    return (
      <button
        type="button"
        onClick={editable ? onClick : undefined}
        style={{ ...base, background: 'transparent', border: '1px dashed var(--line)', color: 'var(--ink3)' }}
      >
        {editable ? '＋' : '–'}
      </button>
    );
  }

  if (cell.status === 'off') {
    return (
      <button type="button" onClick={editable ? onClick : undefined} style={{ ...base, background: 'transparent', border: '1px dashed var(--line)', color: 'var(--ink3)' }}>
        {t.shiftStOff}
      </button>
    );
  }

  if (cell.status === 'paid_leave') {
    const tone = toneStyles.rose;
    return (
      <button type="button" onClick={editable ? onClick : undefined} style={{ ...base, background: tone.soft, color: tone.darkText }}>
        {t.shiftStLeave}
      </button>
    );
  }

  const tone = toneStyles[cell.tone];
  return (
    <button type="button" onClick={editable ? onClick : undefined} style={{ ...base, background: tone.soft, color: tone.darkText }}>
      <span>
        {cell.start}
        <br />
        {cell.end}
      </span>
    </button>
  );
}
