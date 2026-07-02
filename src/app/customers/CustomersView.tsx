'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLang } from '@/i18n/LangProvider';
import { Avatar } from '@/components/ui';
import { Field, FieldRow, FormActions, Modal, Select, TextInput } from '@/components/Modal';
import { toneStyles } from '@/lib/tones';
import { addCustomerMemo, createCustomer, updateCustomer } from '@/lib/actions';
import { TONE_OPTIONS } from '@/lib/formOptions';
import type { CustomerDetail, CustomerListItem, Staff } from '@/lib/types';

type View = 'detail' | 'bulk';

type Props = {
  customerCount: { total: number; withContact: number };
  customerList: CustomerListItem[];
  customerDetail: CustomerDetail | null;
  staff: Staff[];
};

export function CustomersView(props: Props) {
  const [view, setView] = useState<View>('detail');

  if (view === 'bulk') return <BulkView {...props} onBack={() => setView('detail')} />;
  return <DetailView {...props} onBulk={() => setView('bulk')} />;
}

/* ---------------- Detail (list + selected customer) ---------------- */
type Filter = 'all' | 'follow' | 'new';

function DetailView({ customerCount, customerList, customerDetail, staff, onBulk }: Props & { onBulk: () => void }) {
  const { t } = useLang();
  const router = useRouter();
  const d = customerDetail;
  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: t.custFilterAll },
    { key: 'follow', label: t.custFilterFollow },
    { key: 'new', label: t.custFilterNew },
  ];
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [pending, start] = useTransition();
  const [editPending, startEdit] = useTransition();
  const [memoPending, startMemo] = useTransition();

  const visibleCustomers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customerList.filter((c) => {
      if (filter === 'follow' && !c.segmentFollow) return false;
      if (filter === 'new' && !c.segmentNew) return false;
      if (q && !c.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [customerList, filter, query]);

  function submitCustomer(formData: FormData) {
    start(async () => {
      await createCustomer(formData);
      setAddOpen(false);
    });
  }

  function submitEdit(formData: FormData) {
    startEdit(async () => {
      await updateCustomer(formData);
      setEditOpen(false);
    });
  }

  function submitMemo(formData: FormData) {
    startMemo(async () => {
      await addCustomerMemo(formData);
    });
  }

  return (
    <>
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={t.addCustomerTitle}>
        <form action={submitCustomer}>
          <Field label={t.formName}><TextInput name="name" required placeholder={t.formName} /></Field>
          <FieldRow>
            <Field label={t.formEmail}><TextInput type="email" name="email" placeholder="name@example.com" /></Field>
            <Field label={t.formPhone}><TextInput name="phone" placeholder="090-0000-0000" /></Field>
          </FieldRow>
          <FieldRow>
            <Field label={t.formStaffOptional}>
              <Select name="primary_staff_id" defaultValue="">
                <option value="">{t.formNone}</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </Field>
            <Field label={t.formTone}>
              <Select name="tone" defaultValue="accent">
                {TONE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{t[o.labelKey]}</option>
                ))}
              </Select>
            </Field>
          </FieldRow>
          <FormActions cancelLabel={t.formCancel} saveLabel={t.formSave} onCancel={() => setAddOpen(false)} pending={pending} />
        </form>
      </Modal>
      {d && (
        <Modal open={editOpen} onClose={() => setEditOpen(false)} title={t.editCustomerTitle}>
          <form action={submitEdit}>
            <input type="hidden" name="id" value={d.id} />
            <Field label={t.formName}><TextInput name="name" required placeholder={t.formName} defaultValue={d.name} /></Field>
            <FieldRow>
              <Field label={t.formEmail}><TextInput type="email" name="email" placeholder="name@example.com" defaultValue={d.email} /></Field>
              <Field label={t.formPhone}><TextInput name="phone" placeholder="090-0000-0000" defaultValue={d.phone} /></Field>
            </FieldRow>
            <FieldRow>
              <Field label={t.formStaffOptional}>
                <Select name="primary_staff_id" defaultValue={d.primaryStaffId}>
                  <option value="">{t.formNone}</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label={t.formTone}>
                <Select name="tone" defaultValue={d.tone}>
                  {TONE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{t[o.labelKey]}</option>
                  ))}
                </Select>
              </Field>
            </FieldRow>
            <FormActions cancelLabel={t.formCancel} saveLabel={t.formSave} onCancel={() => setEditOpen(false)} pending={editPending} />
          </form>
        </Modal>
      )}
      <div className="toolbar" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 21, fontWeight: 600 }}>{t.custCountLabel} {customerCount.total}</span>
          <span style={{ fontSize: 12, color: 'var(--ink2)' }}>{t.custContactReady} {customerCount.withContact}</span>
        </div>
        <button onClick={() => setAddOpen(true)} style={{ marginLeft: 'auto', font: '500 12.5px var(--ui)', border: '1px solid var(--line)', background: '#fff', borderRadius: 999, padding: '9px 16px', cursor: 'pointer', color: 'var(--ink)', whiteSpace: 'nowrap' }}>＋ {t.btnAddCustomer}</button>
        <button onClick={onBulk} style={{ font: '600 12.5px var(--ui)', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 999, padding: '9px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" strokeLinecap="round" /></svg>
          {t.btnBulkEmail}
        </button>
      </div>

      <div className="grid-split" style={{ display: 'grid', gridTemplateColumns: '318px 1fr', gap: 22, alignItems: 'start' }}>
        {/* List */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: 18, boxShadow: '0 1px 2px rgba(46,42,37,.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FBF9F5', border: '1px solid var(--line)', borderRadius: 999, padding: '8px 13px', marginBottom: 14 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink3)" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" strokeLinecap="round" /></svg>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.search} style={{ border: 'none', outline: 'none', background: 'none', font: '12.5px var(--ui)', color: 'var(--ink)', width: '100%' }} />
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            {filters.map((f) => {
              const on = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  style={{
                    fontSize: 11,
                    padding: '5px 11px',
                    borderRadius: 999,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    background: on ? 'var(--accent)' : '#FBF9F5',
                    color: on ? '#fff' : 'var(--ink2)',
                    border: on ? 'none' : '1px solid var(--line)',
                    font: '11px var(--ui)',
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {visibleCustomers.length === 0 && (
            <div style={{ padding: '24px 10px', textAlign: 'center', fontSize: 12, color: 'var(--ink3)' }}>—</div>
          )}
          {visibleCustomers.map((c) => {
            const active = d ? c.id === d.id : false;
            return (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/customers?id=${c.id}`)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && router.push(`/customers?id=${c.id}`)}
                className={active ? undefined : 'row-hover'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 11,
                  padding: '12px 10px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  marginTop: 8,
                  background: active ? 'var(--accent-soft)' : undefined,
                }}
              >
                <Avatar initial={c.initial} tone={c.tone} size={38} solid={c.tone === 'accent' && active} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink2)' }}>
                    {c.metaKey ? t[c.metaKey] : `${c.visits} ${t.uVisit}`} · {c.date}
                  </div>
                </div>
                {c.unread && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)' }} />}
              </div>
            );
          })}
        </div>

        {/* Selected customer */}
        {d && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: '24px 26px', boxShadow: '0 1px 2px rgba(46,42,37,.04)' }}>
              <div className="toolbar" style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <Avatar initial={d.initial} tone={d.tone} size={54} solid />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 600 }}>{d.name}</span>
                    <span style={{ fontSize: 10.5, padding: '3px 9px', borderRadius: 999, background: 'var(--accent-soft)', color: 'var(--accent)' }}>{t.tagFirst}</span>
                    <span style={{ fontSize: 10.5, padding: '3px 9px', borderRadius: 999, background: 'var(--sage-soft)', color: 'var(--sage)' }}>{t.tagNew}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 18, marginTop: 7, fontSize: 12, color: 'var(--ink2)' }}>
                    <span>✉ {d.email}</span>
                    <span>☎ {d.phone}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => setEditOpen(true)} style={{ font: '500 12.5px var(--ui)', background: '#fff', color: 'var(--ink2)', border: '1px solid var(--line)', borderRadius: 999, padding: '9px 16px', cursor: 'pointer', whiteSpace: 'nowrap' }}>{t.staffEdit}</button>
                  <button style={{ font: '600 12.5px var(--ui)', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 999, padding: '9px 18px', cursor: 'pointer', whiteSpace: 'nowrap' }}>{t.btnSendThanks}</button>
                </div>
              </div>
              <div className="grid-stats-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginTop: 20 }}>
                <Stat label={t.custVisits} value={<>{d.visits} <span style={{ fontSize: 12, color: 'var(--ink3)' }}>{t.uVisit}</span></>} />
                <Stat label={t.custLast} value={d.lastVisit} />
                <Stat label={t.custSpend} value={d.spend} />
              </div>
            </div>

            <div className="grid-split" style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 22, alignItems: 'start' }}>
              {/* Memos */}
              <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px', boxShadow: '0 1px 2px rgba(46,42,37,.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 15, borderBottom: '1px solid var(--line)', marginBottom: 4 }}>
                  <span style={{ fontSize: 11.5, color: 'var(--ink2)', whiteSpace: 'nowrap', flexShrink: 0 }}>{t.currentStaff}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Avatar initial={d.primaryStaff.initial} tone={d.primaryStaff.tone} size={26} />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{d.primaryStaff.name}</span>
                  </div>
                  <button style={{ marginLeft: 'auto', font: '500 11px var(--ui)', border: '1px solid var(--line)', background: '#fff', borderRadius: 999, padding: '5px 13px', cursor: 'pointer', color: 'var(--ink2)', whiteSpace: 'nowrap', flexShrink: 0 }}>{t.changeStaff}</button>
                </div>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 600, margin: '14px 0 4px' }}>{t.secMemo}</h2>

                {d.memos.map((memo, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 0', borderTop: '1px solid var(--line)' }}>
                    <div style={{ width: 42, flex: 'none', fontFamily: 'var(--serif)', fontSize: 16 }}>{memo.date}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                        <span style={{ fontSize: 10, color: 'var(--ink3)' }}>{t.memoBy}</span>
                        <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 999, background: toneStyles[memo.tone].soft, color: toneStyles[memo.tone].strong }}>{memo.staff}</span>
                      </div>
                      <div style={{ fontSize: 12.5, lineHeight: 1.55 }}>{memo.text}</div>
                    </div>
                  </div>
                ))}

                <form
                  action={submitMemo}
                  style={{ marginTop: 14, borderTop: '1px solid var(--line)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 9 }}
                >
                  <input type="hidden" name="customer_id" value={d.id} />
                  <input type="hidden" name="tone" value={d.primaryStaff.tone} />
                  <textarea name="text" required placeholder={t.memoAddPlaceholder} style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '11px 13px', font: '12.5px var(--ui)', outline: 'none', background: '#FBF9F5', resize: 'none', height: 52, width: '100%', boxSizing: 'border-box', color: 'var(--ink)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <select name="staff_name" defaultValue={d.primaryStaff.name || (staff[0]?.name ?? '')} style={{ border: '1px solid var(--line)', borderRadius: 999, padding: '8px 13px', font: '12px var(--ui)', background: '#fff', color: 'var(--ink2)', cursor: 'pointer' }}>
                      {staff.map((s) => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                    <button type="submit" disabled={memoPending} style={{ marginLeft: 'auto', font: '600 12px var(--ui)', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 999, padding: '9px 20px', cursor: memoPending ? 'default' : 'pointer', opacity: memoPending ? 0.6 : 1 }}>{t.memoAdd}</button>
                  </div>
                </form>
              </div>

              {/* Revisit */}
              <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px', boxShadow: '0 1px 2px rgba(46,42,37,.04)' }}>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 600, margin: '0 0 16px' }}>{t.secRevisit}</h2>
                <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
                  <InfoBox label={t.revisitTiming} value={t.revisitTimingVal} />
                  <InfoBox label={t.revisitChannel} value={t.revisitChannelVal} />
                </div>

                <div style={{ position: 'relative', paddingLeft: 26 }}>
                  <div style={{ position: 'absolute', left: 8, top: 6, bottom: 18, width: 2, background: 'var(--line)' }} />
                  <div style={{ position: 'relative', marginBottom: 18 }}>
                    <span style={{ position: 'absolute', left: -26, top: 1, width: 18, height: 18, borderRadius: '50%', background: 'var(--sage)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M5 13l4 4 10-11" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </span>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{t.step1}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink2)' }}>{d.lastVisit} 11:30</div>
                  </div>
                  <div style={{ position: 'relative', marginBottom: 18 }}>
                    <span style={{ position: 'absolute', left: -26, top: 1, width: 18, height: 18, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 0 4px var(--accent-soft)' }} />
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--accent)' }}>{t.step2}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink2)' }}>{t.step2Sub}</div>
                    <span style={{ display: 'inline-block', marginTop: 5, fontSize: 10, padding: '2px 8px', borderRadius: 999, background: 'var(--accent-soft)', color: 'var(--accent)' }}>{t.stWaiting}</span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: -26, top: 1, width: 18, height: 18, borderRadius: '50%', background: '#fff', border: '2px solid var(--line)' }} />
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink3)' }}>{t.step3}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink3)' }}>{t.step3Sub}</div>
                  </div>
                </div>

                <div style={{ marginTop: 18, border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ background: '#FBF9F5', padding: '9px 13px', fontSize: 10, letterSpacing: 0.8, color: 'var(--ink2)', textTransform: 'uppercase', borderBottom: '1px solid var(--line)' }}>{t.emailPreview}</div>
                  <div style={{ padding: 13 }}>
                    <div style={{ fontSize: 10.5, color: 'var(--ink3)' }}>{t.emailSubjectL}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, fontFamily: 'var(--serif)', margin: '2px 0 10px' }}>{t.emailSubjectText}</div>
                    <div style={{ fontSize: 11.5, lineHeight: 1.6, color: 'var(--ink2)' }}>{t.emailBody.replace('{name}', d.name)}</div>
                  </div>
                </div>
                <button style={{ width: '100%', marginTop: 16, font: '600 12.5px var(--ui)', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 999, padding: 11, cursor: 'pointer' }}>{t.btnSendRevisit}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '13px 16px' }}>
      <div style={{ fontSize: 11.5, color: 'var(--ink2)' }}>{label}</div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 600, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1, border: '1px solid var(--line)', borderRadius: 10, padding: '9px 12px' }}>
      <div style={{ fontSize: 10, color: 'var(--ink3)' }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 500, marginTop: 2 }}>{value}</div>
    </div>
  );
}

/* ---------------- Bulk email compose ---------------- */
function BulkView({ customerCount, customerList, onBack }: Props & { onBack: () => void }) {
  const { t } = useLang();
  const segments = [t.bulkSegAll, t.bulkSegContact, t.bulkSegNew, t.bulkSegFollow];
  const recipients = customerList.filter((c) => c.hasEmail);
  const total = customerCount.withContact;
  const more = Math.max(0, total - recipients.length);

  return (
    <>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, font: '500 12.5px var(--ui)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ink2)', padding: 0, marginBottom: 18 }}>‹ {t.bulkBack}</button>
      <div className="grid-split" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 22, alignItems: 'start' }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: '24px 26px', boxShadow: '0 1px 2px rgba(46,42,37,.04)' }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 600, margin: '0 0 20px' }}>{t.bulkTitle}</h2>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--ink2)', marginBottom: 6 }}>{t.bulkSubject}</div>
            <div style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '11px 14px', fontSize: 13.5, background: '#FBF9F5' }}>{t.bulkSubjectVal}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink2)', marginBottom: 6 }}>{t.bulkBodyLabel}</div>
            <div style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 14, fontSize: 12.5, lineHeight: 1.7, background: '#FBF9F5', whiteSpace: 'pre-line', minHeight: 120 }}>{t.bulkBodyVal}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 11, color: 'var(--accent)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" strokeLinecap="round" /></svg>
            {t.bulkVarHint}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18, borderTop: '1px solid var(--line)', paddingTop: 16 }}>
            <span style={{ fontSize: 11, color: 'var(--ink3)', flex: 1, lineHeight: 1.4 }}>{t.bulkExcludeNote}</span>
            <button style={{ font: '600 12px var(--ui)', background: '#fff', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: 999, padding: '9px 16px', cursor: 'pointer', whiteSpace: 'nowrap' }}>{t.bulkSchedule}</button>
            <button style={{ font: '600 12px var(--ui)', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 999, padding: '9px 18px', cursor: 'pointer', whiteSpace: 'nowrap' }}>{t.bulkSend} · {total}</button>
          </div>
        </div>

        <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px', boxShadow: '0 1px 2px rgba(46,42,37,.04)' }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 600, margin: '0 0 14px' }}>{t.bulkRecipients}</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
            {segments.map((s, i) => (
              <span key={s} style={{ fontSize: 11, padding: '5px 11px', borderRadius: 999, whiteSpace: 'nowrap', cursor: 'pointer', background: i === 1 ? 'var(--accent)' : '#FBF9F5', color: i === 1 ? '#fff' : 'var(--ink2)', border: i === 1 ? 'none' : '1px solid var(--line)' }}>{s}</span>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, paddingBottom: 14, borderBottom: '1px solid var(--line)', marginBottom: 14 }}>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 38, fontWeight: 600, lineHeight: 0.9 }}>{total}</span>
            <span style={{ fontSize: 13, color: 'var(--ink3)' }}>名</span>
          </div>
          {recipients.map((c) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
              <Avatar initial={c.initial} tone={c.tone} size={30} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500 }}>{c.name}</div>
              </div>
              <span style={{ fontSize: 10.5, color: 'var(--ink3)' }}>✉</span>
            </div>
          ))}
          {more > 0 && <div style={{ fontSize: 11.5, color: 'var(--ink3)', padding: '8px 0 0' }}>他 {more}名…</div>}
        </div>
      </div>
    </>
  );
}
