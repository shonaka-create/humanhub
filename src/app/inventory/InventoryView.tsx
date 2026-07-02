'use client';

import { useState, useTransition } from 'react';
import { useLang } from '@/i18n/LangProvider';
import { Field, FieldRow, FormActions, Modal, Select, TextInput } from '@/components/Modal';
import { toneStyles } from '@/lib/tones';
import { createInventoryItem, createOrder, orderStockItem, receiveOrder, updateInventoryItem, updateOrder } from '@/lib/actions';
import { CATEGORY_KEYS } from '@/lib/formOptions';
import type { InventoryStatus, OrderRow, OrderStatus, StockItem } from '@/lib/types';

type Tab = 'stock' | 'orders';

const STOCK_COLS = '1.9fr 1.5fr 0.8fr 1.3fr 1fr 1.2fr';
const ORDER_COLS = '2fr 0.7fr 1.3fr 0.9fr 0.9fr 1.1fr 1fr';

export function InventoryView({ stockItems, orderRows }: { stockItems: StockItem[]; orderRows: OrderRow[] }) {
  const { t } = useLang();
  const [tab, setTab] = useState<Tab>('stock');
  const [open, setOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [pending, start] = useTransition();
  const [orderPending, startOrder] = useTransition();

  function submit(formData: FormData) {
    start(async () => {
      await createInventoryItem(formData);
      setOpen(false);
    });
  }

  function submitOrder(formData: FormData) {
    startOrder(async () => {
      await createOrder(formData);
      setOrderOpen(false);
    });
  }

  const tabBtn = (active: boolean): React.CSSProperties => ({
    font: '600 12.5px var(--ui)',
    border: 'none',
    borderRadius: 999,
    padding: '8px 18px',
    cursor: 'pointer',
    transition: 'all .15s',
    whiteSpace: 'nowrap',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#fff' : 'var(--ink2)',
  });

  return (
    <>
      <div className="toolbar" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 5, background: '#FBF9F5', border: '1px solid var(--line)', borderRadius: 999, padding: 4 }}>
          <button onClick={() => setTab('stock')} style={tabBtn(tab === 'stock')}>{t.invTabStock}</button>
          <button onClick={() => setTab('orders')} style={tabBtn(tab === 'orders')}>{t.invTabOrders}</button>
        </div>
        {tab === 'stock' ? (
          <button onClick={() => setOpen(true)} style={{ marginLeft: 'auto', font: '600 12.5px var(--ui)', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 999, padding: '9px 18px', cursor: 'pointer' }}>＋ {t.btnRegister}</button>
        ) : (
          <button onClick={() => setOrderOpen(true)} style={{ marginLeft: 'auto', font: '600 12.5px var(--ui)', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 999, padding: '9px 18px', cursor: 'pointer' }}>＋ {t.btnAddOrder}</button>
        )}
      </div>

      {/* 資材を登録 */}
      <Modal open={open} onClose={() => setOpen(false)} title={t.registerItemTitle}>
        <form action={submit}>
          <Field label={t.formName}><TextInput name="name" required placeholder={t.formName} /></Field>
          <Field label={t.formCategory}>
            <Select name="category_key" defaultValue="catSupply">
              {CATEGORY_KEYS.map((k) => (
                <option key={k} value={k}>{t[k]}</option>
              ))}
            </Select>
          </Field>
          <Field label={t.invSupplier}><TextInput name="supplier" placeholder={t.invSupplier} /></Field>
          <FieldRow>
            <Field label={t.formStock}><TextInput type="number" name="stock" min={0} defaultValue={0} /></Field>
            <Field label={t.formCapacity}><TextInput type="number" name="capacity" min={0} defaultValue={0} /></Field>
          </FieldRow>
          <Field label={t.formReorderPt}><TextInput type="number" name="reorder_pt" min={0} defaultValue={0} /></Field>
          <FormActions cancelLabel={t.formCancel} saveLabel={t.formSave} onCancel={() => setOpen(false)} pending={pending} />
        </form>
      </Modal>

      {/* 発注を追加（手動） */}
      <Modal open={orderOpen} onClose={() => setOrderOpen(false)} title={t.addOrderTitle}>
        <form action={submitOrder}>
          <Field label={t.ordItem}><TextInput name="item" required placeholder={t.ordItem} /></Field>
          <FieldRow>
            <Field label={t.formQty}><TextInput name="qty" placeholder="1" defaultValue="1" /></Field>
            <Field label={t.invSupplier}><TextInput name="supplier" required placeholder={t.invSupplier} /></Field>
          </FieldRow>
          <Field label={t.formEta}><TextInput type="date" name="eta" /></Field>
          <FormActions cancelLabel={t.formCancel} saveLabel={t.formSave} onCancel={() => setOrderOpen(false)} pending={orderPending} />
        </form>
      </Modal>

      {tab === 'stock' ? <StockTable stockItems={stockItems} /> : <OrdersTable orderRows={orderRows} />}
    </>
  );
}

/** 状態の見方を示す凡例（緑=十分 / 黄=残りわずか / 赤=要発注）。 */
function StatusLegend() {
  const { t } = useLang();
  const items: { color: string; label: string }[] = [
    { color: 'var(--sage)', label: t.stOk },
    { color: 'var(--accent)', label: t.stLow },
    { color: 'var(--rose)', label: t.stOrder },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 4 }}>
      <span style={{ fontSize: 11, color: 'var(--ink3)' }}>{t.invLegend}</span>
      {items.map((it) => (
        <span key={it.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--ink2)' }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

function StockTable({ stockItems }: { stockItems: StockItem[] }) {
  const { t } = useLang();
  const [edit, setEdit] = useState<StockItem | null>(null);
  const [editPending, startEdit] = useTransition();

  function submitEdit(formData: FormData) {
    startEdit(async () => {
      await updateInventoryItem(formData);
      setEdit(null);
    });
  }

  const statusChip: Record<InventoryStatus, { label: string; bg: string; color: string; dot: string }> = {
    order: { label: t.stOrder, bg: 'var(--rose-soft)', color: '#8A4E47', dot: 'var(--rose)' },
    low: { label: t.stLow, bg: 'var(--accent-soft)', color: '#6E5142', dot: 'var(--accent)' },
    ordered: { label: t.invOrdered, bg: 'var(--accent-soft)', color: '#6E5142', dot: 'var(--accent)' },
    ok: { label: t.stOk, bg: 'var(--sage-soft)', color: '#4F5B4C', dot: 'var(--sage)' },
  };
  const barTone = (s: InventoryStatus) => (s === 'order' ? 'rose' : s === 'low' || s === 'ordered' ? 'accent' : 'sage');
  const actionFor = (s: InventoryStatus): 'solid' | 'outline' | null =>
    s === 'order' ? 'solid' : s === 'low' ? 'outline' : null;

  return (
    <>
      {edit && (
        <Modal open onClose={() => setEdit(null)} title={t.editItemTitle}>
          <form action={submitEdit}>
            <input type="hidden" name="id" value={edit.id} />
            <Field label={t.formName}><TextInput name="name" required placeholder={t.formName} defaultValue={edit.name} /></Field>
            <Field label={t.formCategory}>
              <Select name="category_key" defaultValue={edit.categoryKey}>
                {CATEGORY_KEYS.map((k) => (
                  <option key={k} value={k}>{t[k]}</option>
                ))}
              </Select>
            </Field>
            <Field label={t.invSupplier}><TextInput name="supplier" placeholder={t.invSupplier} defaultValue={edit.supplier} /></Field>
            <FieldRow>
              <Field label={t.formStock}><TextInput type="number" name="stock" min={0} defaultValue={edit.stock} /></Field>
              <Field label={t.formCapacity}><TextInput type="number" name="capacity" min={0} defaultValue={edit.capacity} /></Field>
            </FieldRow>
            <Field label={t.formReorderPt}><TextInput type="number" name="reorder_pt" min={0} defaultValue={edit.reorderPt} /></Field>
            <FormActions cancelLabel={t.formCancel} saveLabel={t.formSave} onCancel={() => setEdit(null)} pending={editPending} />
          </form>
        </Modal>
      )}
      <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: '14px 24px 16px', boxShadow: '0 1px 2px rgba(46,42,37,.04)' }}>
      <StatusLegend />
      <div className="scroll-x">
        <div style={{ minWidth: 720 }}>
      <div style={{ display: 'grid', gridTemplateColumns: STOCK_COLS, gap: 16, padding: '14px 0', fontSize: 11, letterSpacing: 0.5, color: 'var(--ink2)', textTransform: 'uppercase', borderBottom: '1px solid var(--line)' }}>
        <div>{t.invItem}</div><div>{t.invStock}</div><div>{t.invReorderPt}</div><div>{t.invSupplier}</div><div>{t.invStatus}</div><div style={{ textAlign: 'right' }}>{t.invAction}</div>
      </div>

      {stockItems.map((item, idx) => {
        const chip = statusChip[item.status];
        const tone = toneStyles[barTone(item.status)];
        const pct = item.capacity ? Math.round((item.stock / item.capacity) * 100) : 0;
        const action = actionFor(item.status);
        const last = idx === stockItems.length - 1;
        return (
          <div key={item.id} style={{ display: 'grid', gridTemplateColumns: STOCK_COLS, gap: 16, padding: '15px 0', alignItems: 'center', borderBottom: last ? 'none' : '1px solid var(--line)' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{item.name}</div>
              <div style={{ fontSize: 11, color: 'var(--ink3)' }}>{t[item.categoryKey]}</div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 5 }}>
                <span style={{ fontWeight: 500 }}>{item.stock}</span>
                <span style={{ color: 'var(--ink3)' }}>/ {item.capacity}</span>
              </div>
              <div style={{ height: 6, borderRadius: 6, background: tone.soft, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: tone.strong }} />
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink2)' }}>{item.reorderPt}</div>
            <div style={{ fontSize: 12.5, color: item.supplier ? 'var(--ink2)' : 'var(--ink3)' }}>
              {item.supplier || t.invNoSupplier}
            </div>
            <div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '4px 11px', borderRadius: 999, whiteSpace: 'nowrap', background: chip.bg, color: chip.color }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: chip.dot }} />
                {chip.label}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setEdit(item)}
                style={{ font: '500 11.5px var(--ui)', background: '#fff', color: 'var(--ink2)', border: '1px solid var(--line)', borderRadius: 999, padding: '7px 13px', cursor: 'pointer' }}
              >
                {t.staffEdit}
              </button>
              {action ? (
                <form action={orderStockItem} style={{ display: 'inline' }}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="name" value={item.name} />
                  <input type="hidden" name="qty" value={Math.max(item.capacity - item.stock, 1)} />
                  <input type="hidden" name="supplier" value={item.supplier} />
                  <button
                    type="submit"
                    style={
                      action === 'solid'
                        ? { font: '700 11.5px var(--ui)', background: 'var(--rose)', color: '#fff', border: 'none', borderRadius: 999, padding: '7px 15px', cursor: 'pointer' }
                        : { font: '700 11.5px var(--ui)', background: '#fff', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: 999, padding: '7px 15px', cursor: 'pointer' }
                    }
                  >
                    {action === 'solid' ? t.invOrderNow : t.btnOrder}
                  </button>
                </form>
              ) : item.status === 'ordered' ? (
                <span style={{ fontSize: 12, color: 'var(--accent)' }}>{t.invOrdered}</span>
              ) : (
                <span style={{ color: 'var(--ink3)', fontSize: 13 }}>—</span>
              )}
            </div>
          </div>
        );
      })}
        </div>
      </div>
    </div>
    </>
  );
}

function OrdersTable({ orderRows }: { orderRows: OrderRow[] }) {
  const { t } = useLang();
  const [edit, setEdit] = useState<OrderRow | null>(null);
  const [editPending, startEdit] = useTransition();

  function submitEdit(formData: FormData) {
    startEdit(async () => {
      await updateOrder(formData);
      setEdit(null);
    });
  }

  const statusChip: Record<OrderStatus, { label: string; bg: string; color: string; dot: string; border?: string }> = {
    shipping: { label: t.ordStShipping, bg: 'var(--accent-soft)', color: '#6E5142', dot: 'var(--accent)' },
    ordered: { label: t.ordStOrdered, bg: '#FBF9F5', color: 'var(--ink2)', dot: 'var(--ink3)', border: '1px solid var(--line)' },
    arrived: { label: t.ordStArrived, bg: 'var(--sage-soft)', color: '#4F5B4C', dot: 'var(--sage)' },
  };

  return (
    <>
      {edit && (
        <Modal open onClose={() => setEdit(null)} title={t.editOrderTitle}>
          <form action={submitEdit}>
            <input type="hidden" name="id" value={edit.id} />
            <Field label={t.ordItem}><TextInput name="item" required placeholder={t.ordItem} defaultValue={edit.item} /></Field>
            <FieldRow>
              <Field label={t.formQty}><TextInput name="qty" placeholder="1" defaultValue={edit.qty} /></Field>
              <Field label={t.invSupplier}><TextInput name="supplier" placeholder={t.invSupplier} defaultValue={edit.supplier} /></Field>
            </FieldRow>
            <FieldRow>
              <Field label={t.formOrderDate}><TextInput type="date" name="order_date" defaultValue={edit.orderDateISO} /></Field>
              <Field label={t.formEta}><TextInput type="date" name="eta" defaultValue={edit.etaISO} /></Field>
            </FieldRow>
            <FormActions cancelLabel={t.formCancel} saveLabel={t.formSave} onCancel={() => setEdit(null)} pending={editPending} />
          </form>
        </Modal>
      )}
      <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: '8px 24px 16px', boxShadow: '0 1px 2px rgba(46,42,37,.04)' }}>
      <div className="scroll-x">
        <div style={{ minWidth: 760 }}>
      <div style={{ display: 'grid', gridTemplateColumns: ORDER_COLS, gap: 14, padding: '14px 0', fontSize: 11, letterSpacing: 0.5, color: 'var(--ink2)', textTransform: 'uppercase', borderBottom: '1px solid var(--line)' }}>
        <div>{t.ordItem}</div><div>{t.ordQty}</div><div>{t.ordSupplier}</div><div>{t.ordDate}</div><div>{t.ordEta}</div><div>{t.ordStatus}</div><div style={{ textAlign: 'right' }}>{t.invAction}</div>
      </div>

      {orderRows.map((o, idx) => {
        const chip = statusChip[o.status];
        // 入荷前（発注済み / 入荷待ち）はいつでも入荷登録できるようにする。
        const canReceive = o.status !== 'arrived';
        const last = idx === orderRows.length - 1;
        return (
          <div key={o.id} style={{ display: 'grid', gridTemplateColumns: ORDER_COLS, gap: 14, padding: '15px 0', alignItems: 'center', borderBottom: last ? 'none' : '1px solid var(--line)', fontSize: 13 }}>
            <div style={{ fontWeight: 500 }}>{o.item}</div>
            <div>{o.qty}</div>
            <div style={{ color: 'var(--ink2)' }}>{o.supplier}</div>
            <div style={{ color: 'var(--ink2)' }}>{o.orderDate}</div>
            <div style={{ color: 'var(--ink2)' }}>{o.eta}</div>
            <div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '4px 11px', borderRadius: 999, whiteSpace: 'nowrap', background: chip.bg, color: chip.color, border: chip.border }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: chip.dot }} />
                {chip.label}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setEdit(o)}
                style={{ font: '500 11.5px var(--ui)', background: '#fff', color: 'var(--ink2)', border: '1px solid var(--line)', borderRadius: 999, padding: '7px 13px', cursor: 'pointer' }}
              >
                {t.staffEdit}
              </button>
              {canReceive ? (
                <form action={receiveOrder} style={{ display: 'inline' }}>
                  <input type="hidden" name="id" value={o.id} />
                  <button type="submit" style={{ font: '700 11.5px var(--ui)', background: 'var(--sage)', color: '#fff', border: 'none', borderRadius: 999, padding: '7px 14px', cursor: 'pointer' }}>{t.invReceiveBtn}</button>
                </form>
              ) : (
                <span style={{ color: 'var(--sage)', fontSize: 12 }}>✓ {t.ordStArrived}</span>
              )}
            </div>
          </div>
        );
      })}
        </div>
      </div>
    </div>
    </>
  );
}
