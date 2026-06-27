'use client';

import { useState } from 'react';
import { useLang } from '@/i18n/LangProvider';
import { toneStyles } from '@/lib/tones';
import { orderRows, stockItems } from '@/lib/mock';
import type { InventoryStatus, OrderStatus } from '@/lib/types';

type Tab = 'stock' | 'orders';

const STOCK_COLS = '2.3fr 2fr 1fr 1.1fr 0.9fr';
const ORDER_COLS = '2fr 0.7fr 1.3fr 0.9fr 0.9fr 1.1fr 1fr';

export default function InventoryPage() {
  const { t } = useLang();
  const [tab, setTab] = useState<Tab>('stock');

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
        <div style={{ display: 'flex', gap: 5, background: '#FBF9F5', border: '1px solid var(--line)', borderRadius: 999, padding: 4 }}>
          <button onClick={() => setTab('stock')} style={tabBtn(tab === 'stock')}>{t.invTabStock}</button>
          <button onClick={() => setTab('orders')} style={tabBtn(tab === 'orders')}>{t.invTabOrders}</button>
        </div>
        <button style={{ marginLeft: 'auto', font: '600 12.5px var(--ui)', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 999, padding: '9px 18px', cursor: 'pointer' }}>＋ {t.btnRegister}</button>
      </div>

      {tab === 'stock' ? <StockTable /> : <OrdersTable />}
    </>
  );
}

function StockTable() {
  const { t } = useLang();

  const statusChip: Record<InventoryStatus, { label: string; bg: string; color: string }> = {
    order: { label: t.stOrder, bg: 'var(--rose-soft)', color: '#8A4E47' },
    low: { label: t.stLow, bg: 'var(--accent-soft)', color: '#6E5142' },
    ordered: { label: t.invOrdered, bg: 'var(--accent-soft)', color: '#6E5142' },
    ok: { label: t.stOk, bg: 'var(--sage-soft)', color: '#4F5B4C' },
  };
  // bar tone per status
  const barTone = (s: InventoryStatus) => (s === 'order' ? 'rose' : s === 'low' || s === 'ordered' ? 'accent' : 'sage');
  // whether to show an action button, and its variant
  const actionFor = (s: InventoryStatus): 'solid' | 'outline' | null =>
    s === 'order' ? 'solid' : s === 'low' ? 'outline' : null;

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: '8px 24px 16px', boxShadow: '0 1px 2px rgba(46,42,37,.04)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: STOCK_COLS, gap: 16, padding: '14px 0', fontSize: 11, letterSpacing: 0.5, color: 'var(--ink2)', textTransform: 'uppercase', borderBottom: '1px solid var(--line)' }}>
        <div>{t.invItem}</div><div>{t.invStock}</div><div>{t.invReorderPt}</div><div>{t.invStatus}</div><div style={{ textAlign: 'right' }}>{t.invAction}</div>
      </div>

      {stockItems.map((item, idx) => {
        const chip = statusChip[item.status];
        const tone = toneStyles[barTone(item.status)];
        const pct = Math.round((item.stock / item.capacity) * 100);
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
            <div>
              <span style={{ fontSize: 11, padding: '4px 11px', borderRadius: 999, whiteSpace: 'nowrap', background: chip.bg, color: chip.color }}>{chip.label}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              {action === 'solid' && <button style={{ font: '600 11.5px var(--ui)', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 999, padding: '7px 15px', cursor: 'pointer' }}>{t.btnOrder}</button>}
              {action === 'outline' && <button style={{ font: '600 11.5px var(--ui)', background: '#fff', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: 999, padding: '7px 15px', cursor: 'pointer' }}>{t.btnOrder}</button>}
              {action === null && <span style={{ color: 'var(--ink3)', fontSize: 13 }}>—</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OrdersTable() {
  const { t } = useLang();

  const statusChip: Record<OrderStatus, { label: string; bg: string; color: string; border?: string }> = {
    shipping: { label: t.ordStShipping, bg: 'var(--accent-soft)', color: '#6E5142' },
    ordered: { label: t.ordStOrdered, bg: '#FBF9F5', color: 'var(--ink2)', border: '1px solid var(--line)' },
    arrived: { label: t.ordStArrived, bg: 'var(--sage-soft)', color: '#4F5B4C' },
  };

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: '8px 24px 16px', boxShadow: '0 1px 2px rgba(46,42,37,.04)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: ORDER_COLS, gap: 14, padding: '14px 0', fontSize: 11, letterSpacing: 0.5, color: 'var(--ink2)', textTransform: 'uppercase', borderBottom: '1px solid var(--line)' }}>
        <div>{t.ordItem}</div><div>{t.ordQty}</div><div>{t.ordSupplier}</div><div>{t.ordDate}</div><div>{t.ordEta}</div><div>{t.ordStatus}</div><div style={{ textAlign: 'right' }}>{t.invAction}</div>
      </div>

      {orderRows.map((o, idx) => {
        const chip = statusChip[o.status];
        const canReceive = o.status === 'shipping';
        const last = idx === orderRows.length - 1;
        return (
          <div key={o.id} style={{ display: 'grid', gridTemplateColumns: ORDER_COLS, gap: 14, padding: '15px 0', alignItems: 'center', borderBottom: last ? 'none' : '1px solid var(--line)', fontSize: 13 }}>
            <div style={{ fontWeight: 500 }}>{o.item}</div>
            <div>{o.qty}</div>
            <div style={{ color: 'var(--ink2)' }}>{o.supplier}</div>
            <div style={{ color: 'var(--ink2)' }}>{o.orderDate}</div>
            <div style={{ color: 'var(--ink2)' }}>{o.eta}</div>
            <div>
              <span style={{ fontSize: 11, padding: '4px 11px', borderRadius: 999, whiteSpace: 'nowrap', background: chip.bg, color: chip.color, border: chip.border }}>{chip.label}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              {canReceive ? (
                <button style={{ font: '600 11.5px var(--ui)', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 999, padding: '7px 14px', cursor: 'pointer' }}>{t.btnReceive}</button>
              ) : (
                <span style={{ color: 'var(--ink3)' }}>—</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
