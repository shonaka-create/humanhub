'use client';

import { useState, useTransition } from 'react';
import { useLang } from '@/i18n/LangProvider';
import { Avatar } from '@/components/ui';
import { Field, FieldRow, FormActions, Modal, Select, TextInput } from '@/components/Modal';
import { createStaff, updateStaff } from '@/lib/actions';
import { TONE_OPTIONS } from '@/lib/formOptions';
import type { Staff } from '@/lib/types';

export function SettingsView({ staff, canManage }: { staff: Staff[]; canManage: boolean }) {
  const { t } = useLang();
  // null=閉じている / 'new'=追加 / Staff=編集。
  const [editing, setEditing] = useState<'new' | Staff | null>(null);
  const [pending, start] = useTransition();
  const current = editing === 'new' ? null : editing;

  function submit(formData: FormData) {
    start(async () => {
      await (current ? updateStaff(formData) : createStaff(formData));
      setEditing(null);
    });
  }

  return (
    <>
      <div className="toolbar" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 600 }}>{t.settingsStaffTitle}</div>
          <div style={{ fontSize: 12, color: 'var(--ink2)', marginTop: 3 }}>{t.settingsStaffDesc}</div>
        </div>
        {canManage && (
          <button onClick={() => setEditing('new')} style={{ marginLeft: 'auto', font: '600 12.5px var(--ui)', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 999, padding: '9px 18px', cursor: 'pointer' }}>＋ {t.settingsAddStaff}</button>
        )}
      </div>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={current ? t.editStaffTitle : t.addStaffTitle}>
        {/* key で追加↔編集の切替時にフォームの defaultValue を確実に反映させる。 */}
        <form action={submit} key={current?.id ?? 'new'}>
          {current && <input type="hidden" name="id" value={current.id} />}
          <Field label={t.formName}><TextInput name="name" required placeholder={t.formName} defaultValue={current?.name ?? ''} /></Field>
          <FieldRow>
            <Field label={t.formInitial}><TextInput name="initial" maxLength={2} placeholder="A" defaultValue={current?.initial ?? ''} /></Field>
            <Field label={t.formWeeklyHours}><TextInput type="number" name="weekly_hours" min={0} defaultValue={current?.weeklyHours ?? 40} /></Field>
          </FieldRow>
          <Field label={t.formEmail}><TextInput type="email" name="email" placeholder={t.formEmail} defaultValue={current?.email ?? ''} /></Field>
          <div style={{ fontSize: 11, color: 'var(--ink3)', lineHeight: 1.6, margin: '-4px 0 14px' }}>{t.formEmailStaffHint}</div>
          <Field label={t.formTone}>
            <Select name="tone" defaultValue={current?.tone ?? 'accent'}>
              {TONE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{t[o.labelKey]}</option>
              ))}
            </Select>
          </Field>
          <FormActions cancelLabel={t.formCancel} saveLabel={t.formSave} onCancel={() => setEditing(null)} pending={pending} />
        </form>
      </Modal>

      <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: '8px 24px 16px', boxShadow: '0 1px 2px rgba(46,42,37,.04)' }}>
        {staff.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ink3)', fontSize: 13 }}>{t.settingsNoStaff}</div>
        )}
        {staff.map((s, idx) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 0', borderBottom: idx === staff.length - 1 ? 'none' : '1px solid var(--line)' }}>
            <Avatar initial={s.initial} tone={s.tone} size={38} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{s.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.email ? s.email : `${t.weeklyShort} ${s.weeklyHours}h`}
              </div>
            </div>
            <span
              style={{
                fontSize: 11,
                padding: '4px 11px',
                borderRadius: 999,
                background: s.linked ? 'var(--sage-soft)' : 'var(--line)',
                color: s.linked ? 'var(--sage)' : 'var(--ink3)',
                whiteSpace: 'nowrap',
              }}
            >
              {s.linked ? t.staffLinked : t.staffUnlinked}
            </span>
            {canManage && (
              <button
                onClick={() => setEditing(s)}
                style={{ font: '600 12px var(--ui)', background: '#fff', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: 999, padding: '6px 14px', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {t.staffEdit}
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
