'use server';

// 各画面の「追加 / 登録」操作に対応する Server Actions。
// フォーム送信 → Supabase へ INSERT/UPSERT/UPDATE → 該当パスを revalidate。
// RLS によりログイン済みユーザーのみ実行可能（匿名は不可）。

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getPayrollComputation } from '@/lib/data';
import { requireOwner } from '@/lib/tenant';
import type { Tone } from '@/lib/types';

/** 文字列の先頭1文字を大文字イニシャルに。空なら '?'。 */
function initialOf(name: string): string {
  return (name.trim()[0] ?? '?').toUpperCase();
}

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? '').trim();
}

function num(fd: FormData, key: string): number {
  return Number(fd.get(key) ?? 0) || 0;
}

/** 指定スタッフの配色を取得（見つからなければ 'accent'）。 */
async function staffTone(
  supabase: Awaited<ReturnType<typeof createClient>>,
  staffId: string,
): Promise<Tone> {
  if (!staffId) return 'accent';
  const { data } = await supabase.from('staff').select('tone').eq('id', staffId).maybeSingle();
  return (data?.tone as Tone) ?? 'accent';
}

/* ------------------------- 顧客 ------------------------- */
export async function createCustomer(formData: FormData) {
  const name = str(formData, 'name');
  if (!name) return;
  const supabase = await createClient();
  const tone = (str(formData, 'tone') || 'accent') as Tone;
  const staffId = str(formData, 'primary_staff_id');
  const { error } = await supabase.from('customers').insert({
    name,
    initial: initialOf(name),
    tone,
    email: str(formData, 'email') || null,
    phone: str(formData, 'phone') || null,
    primary_staff_id: staffId || null,
    first_visit: new Date().toISOString().slice(0, 10),
    last_visit: new Date().toISOString().slice(0, 10),
    visits: 0,
  });
  if (error) throw error;
  revalidatePath('/customers');
  revalidatePath('/');
}

/** 顧客詳細のメモ追加。 */
export async function addCustomerMemo(formData: FormData) {
  const customerId = str(formData, 'customer_id');
  const text = str(formData, 'text');
  if (!customerId || !text) return;
  const supabase = await createClient();
  const staffName = str(formData, 'staff_name');
  const { error } = await supabase.from('customer_memos').insert({
    customer_id: customerId,
    memo_date: new Date().toISOString().slice(0, 10),
    staff_name: staffName || null,
    tone: (str(formData, 'tone') || 'accent') as Tone,
    text,
  });
  if (error) throw error;
  revalidatePath('/customers');
}

/* ------------------------- 予約 ------------------------- */
export async function createBooking(formData: FormData) {
  const date = str(formData, 'booking_date');
  const time = str(formData, 'start_time');
  const customer = str(formData, 'customer_name');
  if (!date || !time || !customer) return;
  const supabase = await createClient();
  const staffId = str(formData, 'staff_id');
  const { error } = await supabase.from('bookings').insert({
    booking_date: date,
    start_time: time,
    duration_min: num(formData, 'duration_min') || 60,
    staff_id: staffId || null,
    customer_name: customer,
    service_key: str(formData, 'service_key') || null,
    tone: await staffTone(supabase, staffId),
  });
  if (error) throw error;
  revalidatePath('/bookings');
  revalidatePath('/');
}

/* ------------------------- シフト ------------------------- */
export async function upsertShift(formData: FormData) {
  const staffId = str(formData, 'staff_id');
  const weekday = num(formData, 'weekday');
  const start = str(formData, 'start_time');
  const end = str(formData, 'end_time');
  if (!staffId || !start || !end) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from('shifts')
    .upsert(
      {
        staff_id: staffId,
        weekday,
        start_time: start,
        end_time: end,
        tone: await staffTone(supabase, staffId),
      },
      { onConflict: 'staff_id,weekday' },
    );
  if (error) throw error;
  revalidatePath('/shifts');
  revalidatePath('/');
}

/* ------------------------- シフト実績（日付ベース） ------------------------- */
/** 'YYYY-MM-DD'（ローカル日付）。 */
function ymdLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 1日のシフト実績を追加/更新（staff_id×work_date で upsert）。 */
export async function upsertShiftEntry(formData: FormData) {
  const staffId = str(formData, 'staff_id');
  const date = str(formData, 'work_date');
  if (!staffId || !date) return;
  const status = (str(formData, 'status') || 'worked') as 'worked' | 'off' | 'paid_leave';
  const start = str(formData, 'start_time');
  const end = str(formData, 'end_time');
  // 出勤なら時刻必須。休み/有給は時刻を持たないので 00:00 で埋める（DB は not null）。
  if (status === 'worked' && (!start || !end)) return;
  const startVal = status === 'worked' ? start : start || '00:00';
  const endVal = status === 'worked' ? end : end || start || '00:00';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from('shift_entries').upsert(
    {
      staff_id: staffId,
      work_date: date,
      start_time: startVal,
      end_time: endVal,
      break_min: num(formData, 'break_min'),
      status,
      note: str(formData, 'note') || null,
      tone: await staffTone(supabase, staffId),
      updated_by: user?.id ?? null,
    },
    { onConflict: 'staff_id,work_date' },
  );
  if (error) throw error;
  revalidatePath('/shifts');
  revalidatePath('/');
}

/** シフト実績を1件削除。 */
export async function deleteShiftEntry(formData: FormData) {
  const id = str(formData, 'id');
  if (!id) return;
  const supabase = await createClient();
  const { error } = await supabase.from('shift_entries').delete().eq('id', id);
  if (error) throw error;
  revalidatePath('/shifts');
  revalidatePath('/');
}

/**
 * 週テンプレート（shifts）から、指定週（月曜起点）の実績を一括生成。
 * 既存の実績は上書きしない（手修正を保持）。オーナー専用の想定。
 */
export async function generateWeekFromTemplate(formData: FormData) {
  const weekStart = str(formData, 'week_start');
  if (!weekStart) return;
  await requireOwner(); // 一括生成はオーナーのみ（RLS と併せた二重防御）。
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: templates, error } = await supabase
    .from('shifts')
    .select('staff_id, weekday, start_time, end_time, tone');
  if (error) throw error;

  const [y, m, d] = weekStart.split('-').map(Number);
  const base = new Date(y, m - 1, d);
  const rows = (templates ?? []).map((tpl) => {
    const dt = new Date(base);
    dt.setDate(dt.getDate() + tpl.weekday); // weekday 0=月 → +0..+6
    return {
      staff_id: tpl.staff_id,
      work_date: ymdLocal(dt),
      start_time: tpl.start_time,
      end_time: tpl.end_time,
      status: 'worked' as const,
      tone: tpl.tone as Tone,
      updated_by: user?.id ?? null,
    };
  });
  if (rows.length === 0) return;

  const { error: e2 } = await supabase
    .from('shift_entries')
    .upsert(rows, { onConflict: 'staff_id,work_date', ignoreDuplicates: true });
  if (e2) throw e2;
  revalidatePath('/shifts');
  revalidatePath('/');
}

/* ------------------------- 給与テーブル ------------------------- */
/** スタッフの給与レートを追加/更新（staff_id×effective_from で upsert）。オーナー専用。 */
export async function upsertPayRate(formData: FormData) {
  const staffId = str(formData, 'staff_id');
  const effectiveFrom = str(formData, 'effective_from');
  if (!staffId || !effectiveFrom) return;
  await requireOwner();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from('pay_rates').upsert(
    {
      staff_id: staffId,
      effective_from: effectiveFrom,
      hourly_wage: num(formData, 'hourly_wage'),
      commute_allowance: num(formData, 'commute_allowance'),
      other_allowance: num(formData, 'other_allowance'),
      note: str(formData, 'note') || null,
      updated_by: user?.id ?? null,
    },
    { onConflict: 'staff_id,effective_from' },
  );
  if (error) throw error;
  revalidatePath('/payroll');
}

/* ------------------------- 月次給与計算 ------------------------- */
/** 対象月の実働×時給を自動集計し、下書き run＋明細を作成/更新。オーナー専用。 */
export async function runPayroll(formData: FormData) {
  const period = str(formData, 'period');
  if (!/^\d{4}-\d{2}$/.test(period)) return;
  const membership = await requireOwner();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 確定済みなら再計算しない（根拠保全）。
  const { data: existing } = await supabase
    .from('payroll_runs')
    .select('id, status')
    .eq('period', period)
    .maybeSingle();
  if (existing?.status === 'confirmed') return;

  let runId = existing?.id as string | undefined;
  if (!runId) {
    const { data: created, error } = await supabase
      .from('payroll_runs')
      .insert({ tenant_id: membership.tenantId, period, status: 'draft' })
      .select('id')
      .single();
    if (error) throw error;
    runId = created.id;
  }

  const comp = await getPayrollComputation(period);
  // 既存明細の控除・調整は保持したまま、基本給・手当を再計算する。
  const { data: prev } = await supabase
    .from('payslips')
    .select('staff_id, deduction, adjustment')
    .eq('run_id', runId);
  const prevMap = new Map(
    (prev ?? []).map((p) => [p.staff_id, { deduction: Number(p.deduction), adjustment: Number(p.adjustment) }]),
  );

  const rows = comp.map((c) => {
    const keep = prevMap.get(c.staffId) ?? { deduction: 0, adjustment: 0 };
    const gross = c.basePay + c.allowance + keep.adjustment;
    return {
      run_id: runId,
      staff_id: c.staffId,
      worked_min: c.workedMin,
      base_pay: c.basePay,
      allowance: c.allowance,
      deduction: keep.deduction,
      adjustment: keep.adjustment,
      gross_pay: gross,
      net_pay: gross - keep.deduction,
      updated_by: user?.id ?? null,
    };
  });
  const { error: e2 } = await supabase.from('payslips').upsert(rows, { onConflict: 'run_id,staff_id' });
  if (e2) throw e2;
  revalidatePath('/payroll');
}

/** 明細の控除・調整を更新し、総支給/差引支給を再計算。確定済みは不可。 */
export async function updatePayslip(formData: FormData) {
  const id = str(formData, 'payslip_id');
  if (!id) return;
  await requireOwner();
  const supabase = await createClient();

  const { data: slip } = await supabase
    .from('payslips')
    .select('base_pay, allowance, run_id')
    .eq('id', id)
    .maybeSingle();
  if (!slip) return;
  const { data: run } = await supabase.from('payroll_runs').select('status').eq('id', slip.run_id).maybeSingle();
  if (run?.status === 'confirmed') return;

  const deduction = num(formData, 'deduction');
  const adjustment = num(formData, 'adjustment');
  const gross = Number(slip.base_pay) + Number(slip.allowance) + adjustment;
  const { error } = await supabase
    .from('payslips')
    .update({ deduction, adjustment, gross_pay: gross, net_pay: gross - deduction })
    .eq('id', id);
  if (error) throw error;
  revalidatePath('/payroll');
}

/** 対象月を確定（＝該当月のシフトをロック）。オーナー専用。 */
export async function confirmPayroll(formData: FormData) {
  const period = str(formData, 'period');
  if (!period) return;
  await requireOwner();
  const supabase = await createClient();
  const { error } = await supabase
    .from('payroll_runs')
    .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
    .eq('period', period);
  if (error) throw error;
  revalidatePath('/payroll');
  revalidatePath('/shifts');
}

/** 確定を解除して下書きへ戻す（シフトのロックも解除）。オーナー専用。 */
export async function reopenPayroll(formData: FormData) {
  const period = str(formData, 'period');
  if (!period) return;
  await requireOwner();
  const supabase = await createClient();
  const { error } = await supabase
    .from('payroll_runs')
    .update({ status: 'draft', confirmed_at: null })
    .eq('period', period);
  if (error) throw error;
  revalidatePath('/payroll');
  revalidatePath('/shifts');
}

/* ------------------------- 売上 ------------------------- */
export async function createTransaction(formData: FormData) {
  const date = str(formData, 'txn_date');
  const customer = str(formData, 'customer_name');
  const amount = num(formData, 'amount');
  if (!date || !customer || !amount) return;
  const supabase = await createClient();
  const { error } = await supabase.from('transactions').insert({
    txn_date: date,
    customer_name: customer,
    staff_id: str(formData, 'staff_id') || null,
    service_key: str(formData, 'service_key') || null,
    category: (str(formData, 'category') || 'service') as 'service' | 'retail',
    amount,
  });
  if (error) throw error;
  revalidatePath('/sales');
  revalidatePath('/');
}

/* ------------------------- 資材（在庫） ------------------------- */
export async function createInventoryItem(formData: FormData) {
  const name = str(formData, 'name');
  if (!name) return;
  const supabase = await createClient();
  const stock = num(formData, 'stock');
  const reorderPt = num(formData, 'reorder_pt');
  const status = stock <= 0 ? 'order' : stock <= reorderPt ? 'low' : 'ok';
  const { error } = await supabase.from('inventory_items').insert({
    name,
    category_key: str(formData, 'category_key') || 'catSupply',
    stock,
    capacity: num(formData, 'capacity') || stock,
    reorder_pt: reorderPt,
    status,
    supplier: str(formData, 'supplier') || null,
  });
  if (error) throw error;
  revalidatePath('/inventory');
  revalidatePath('/');
}

/** 在庫アイテムを「発注済み」にし、orders に1行追加する。 */
export async function orderStockItem(formData: FormData) {
  const id = str(formData, 'id');
  const name = str(formData, 'name');
  if (!id) return;
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const eta = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const { error: e1 } = await supabase.from('inventory_items').update({ status: 'ordered' }).eq('id', id);
  if (e1) throw e1;
  const { error: e2 } = await supabase.from('orders').insert({
    item: name || '—',
    qty: str(formData, 'qty') || '1',
    supplier: str(formData, 'supplier') || '未設定',
    order_date: today,
    eta,
    status: 'ordered',
  });
  if (e2) throw e2;
  revalidatePath('/inventory');
  revalidatePath('/');
}

/* ------------------------- 発注 ------------------------- */
export async function createOrder(formData: FormData) {
  const item = str(formData, 'item');
  if (!item) return;
  const supabase = await createClient();
  const { error } = await supabase.from('orders').insert({
    item,
    qty: str(formData, 'qty') || '1',
    supplier: str(formData, 'supplier') || '—',
    order_date: str(formData, 'order_date') || new Date().toISOString().slice(0, 10),
    eta: str(formData, 'eta') || null,
    status: 'ordered',
  });
  if (error) throw error;
  revalidatePath('/inventory');
}

/** 発注を「入荷済み」にする。 */
export async function receiveOrder(formData: FormData) {
  const id = str(formData, 'id');
  if (!id) return;
  const supabase = await createClient();
  const { error } = await supabase.from('orders').update({ status: 'arrived' }).eq('id', id);
  if (error) throw error;
  revalidatePath('/inventory');
}

/* ------------------------- 設定（スタッフ） ------------------------- */
export async function createStaff(formData: FormData) {
  const name = str(formData, 'name');
  if (!name) return;
  const supabase = await createClient();
  const id = str(formData, 'id') || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `staff-${Date.now()}`;
  const { error } = await supabase.from('staff').insert({
    id,
    name,
    initial: str(formData, 'initial') || initialOf(name),
    tone: (str(formData, 'tone') || 'accent') as Tone,
    weekly_hours: num(formData, 'weekly_hours'),
  });
  if (error) throw error;
  revalidatePath('/settings');
  revalidatePath('/shifts');
  revalidatePath('/');
}
