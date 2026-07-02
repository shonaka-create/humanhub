// Supabase データアクセス層。mock.ts の各 export に対応する非同期版。
// ページを mock から切り替えるには import を差し替えて await するだけ:
//   import { staff } from '@/lib/mock';        →  import { getStaff } from '@/lib/data';
//   const rows = staff;                         →  const rows = await getStaff();
// ※ 呼び出し側は Server Component / Route Handler / Server Action である必要がある。

import { createClient } from '@/lib/supabase/server';
import { getMembership } from '@/lib/tenant';
import type {
  BookingBlock,
  CustomerDetail,
  CustomerListItem,
  FollowUp,
  LabelKey,
  OrderRow,
  SalesCategory,
  SalesMonthBar,
  SalesStaffRank,
  SalesSummary,
  SalesTxn,
  PayRate,
  ScheduleEntry,
  ShiftCell,
  ShiftEntryCell,
  ShiftRow,
  ShiftStatus,
  ShiftWeekRow,
  Staff,
  StaffRole,
  StockAlert,
  StockItem,
  Tone,
} from './types';

/** ISO 日付文字列を 'M/D'（先頭ゼロなし）に整形。 */
function md(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${Number(m)}/${Number(d)}`;
}

/** YYYY-MM-DD（ローカル日付）。 */
function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** JS の getDay()(0=日) を shifts.weekday(0=月..6=日) に変換。 */
function weekdayMonFirst(d: Date): number {
  return (d.getDay() + 6) % 7;
}

/** DB の time 値（'09:30:00'）を 'HH:MM' に整形。 */
function hhmm(t: string): string {
  return t.slice(0, 5);
}

export type CurrentUser = {
  name: string;
  initial: string;
  email: string;
  role: StaffRole;
  tenantId: string;
  tenantName: string;
};

/**
 * ログイン中ユーザーの表示名・イニシャル・ロール・所属テナントを返す（未ログイン/エラー時は null）。
 * 初回ログイン時はここで membership を用意する（新規オーナー作成 or 招待受諾）。
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const membership = await getMembership();
    if (!membership) return null;
    const meta = (user.user_metadata ?? {}) as { display_name?: string; initial?: string };
    const name = (meta.display_name || membership.displayName || user.email?.split('@')[0] || 'User').trim();
    const initial = (meta.initial || name[0] || 'U').toUpperCase();
    return {
      name,
      initial,
      email: user.email ?? '',
      role: membership.role,
      tenantId: membership.tenantId,
      tenantName: membership.tenantName,
    };
  } catch {
    return null;
  }
}

/** 'YYYY-MM-DD' をローカル Date に（TZ ずれ防止）。 */
function parseYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

/** 指定日（既定: 今日）を含む週の月曜日を 'YYYY-MM-DD' で返す。 */
export function mondayYmd(base: string | Date = new Date()): string {
  const d = typeof base === 'string' ? parseYmd(base) : new Date(base);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return ymd(d);
}

/** 'HH:MM'（または 'HH:MM:SS'）を分に変換。 */
function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export type CurrentStaff = { staffId: string | null; role: StaffRole };

/**
 * ログイン中ユーザーのロール（memberships が正）と、紐付く staff 業務レコードを返す。
 * staffId は staff.user_id = auth.uid() の行（未紐付けなら null）。
 * ロール判定にはテナントの membership を用いる。未ログイン時は null。
 */
export async function getCurrentStaff(): Promise<CurrentStaff | null> {
  const membership = await getMembership();
  if (!membership) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // RLS によりテナント内の staff のみが対象。user_id で本人の業務レコードを解決。
  const { data: me } = await supabase
    .from('staff')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  return { staffId: me?.id ?? null, role: membership.role };
}

/** 指定週（月曜起点）のシフト実績をスタッフ×7日で組み立てる。 */
export async function getShiftWeek(weekStart: string): Promise<ShiftWeekRow[]> {
  const supabase = await createClient();
  const end = ymd(addDays(parseYmd(weekStart), 6));

  const [staffRes, entryRes] = await Promise.all([
    supabase.from('staff').select('id, name, initial, tone').order('created_at', { ascending: true }),
    supabase
      .from('shift_entries')
      .select('id, staff_id, work_date, start_time, end_time, break_min, status, tone, note')
      .gte('work_date', weekStart)
      .lte('work_date', end),
  ]);
  if (staffRes.error) throw staffRes.error;
  if (entryRes.error) throw entryRes.error;

  const rows = new Map<string, ShiftWeekRow>();
  for (const s of staffRes.data ?? []) {
    rows.set(s.id, {
      staff: { id: s.id, initial: s.initial, name: s.name, tone: s.tone as Tone },
      days: Array(7).fill(null),
      workedMin: 0,
    });
  }

  for (const e of entryRes.data ?? []) {
    const row = rows.get(e.staff_id);
    if (!row) continue;
    const dayIdx = (parseYmd(e.work_date).getDay() + 6) % 7; // 0=月..6=日
    const start = hhmm(e.start_time);
    const end2 = hhmm(e.end_time);
    row.days[dayIdx] = {
      id: e.id,
      start,
      end: end2,
      breakMin: e.break_min,
      status: e.status as ShiftStatus,
      tone: e.tone as Tone,
      note: e.note ?? '',
    };
    if (e.status === 'worked') {
      row.workedMin += Math.max(0, toMin(end2) - toMin(start) - (e.break_min ?? 0));
    }
  }

  return [...rows.values()];
}

export type PayRateRow = {
  staff: { id: string; initial: string; name: string; tone: Tone };
  /** 本日時点で有効な最新の給与設定（未設定なら null）。 */
  current: PayRate | null;
};

/** 給与テーブル管理用: スタッフ一覧と、各人の現行（適用中）レートを返す。 */
export async function getPayRateRows(): Promise<PayRateRow[]> {
  const supabase = await createClient();
  const today = ymd(new Date());

  const [staffRes, rateRes] = await Promise.all([
    supabase.from('staff').select('id, name, initial, tone').order('created_at', { ascending: true }),
    supabase
      .from('pay_rates')
      .select('id, staff_id, effective_from, hourly_wage, commute_allowance, other_allowance, note')
      .lte('effective_from', today)
      .order('effective_from', { ascending: false }),
  ]);
  if (staffRes.error) throw staffRes.error;
  if (rateRes.error) throw rateRes.error;

  // effective_from 降順なので、staff ごとに最初に見つかった＝現行レート。
  const current = new Map<string, PayRate>();
  for (const r of rateRes.data ?? []) {
    if (current.has(r.staff_id)) continue;
    current.set(r.staff_id, {
      id: r.id,
      staffId: r.staff_id,
      effectiveFrom: r.effective_from,
      hourlyWage: Number(r.hourly_wage),
      commuteAllowance: Number(r.commute_allowance),
      otherAllowance: Number(r.other_allowance),
      note: r.note ?? '',
    });
  }

  return (staffRes.data ?? []).map((s) => ({
    staff: { id: s.id, initial: s.initial, name: s.name, tone: s.tone as Tone },
    current: current.get(s.id) ?? null,
  }));
}

/** 'YYYY-MM' の月初・月末（ローカル日付文字列）。 */
function monthRange(period: string): { start: string; end: string } {
  const [y, m] = period.split('-').map(Number);
  return { start: ymd(new Date(y, m - 1, 1)), end: ymd(new Date(y, m, 0)) };
}

export type PayrollComputationRow = {
  staffId: string;
  workedMin: number;
  basePay: number;
  allowance: number;
};

/**
 * 指定月の「実働シフト × 時給」を自動集計（未保存のプレビュー計算）。
 * - 実働: shift_entries の worked を分単位で合算（休憩控除）。
 * - 時給: pay_rates を勤務日ごとに適用（effective_from の履歴を反映）。
 * - 手当: 月末時点で有効なレートの交通費＋その他手当（月額）。
 */
export async function getPayrollComputation(period: string): Promise<PayrollComputationRow[]> {
  const supabase = await createClient();
  const { start, end } = monthRange(period);

  const [staffRes, entryRes, rateRes] = await Promise.all([
    supabase.from('staff').select('id').order('created_at', { ascending: true }),
    supabase
      .from('shift_entries')
      .select('staff_id, work_date, start_time, end_time, break_min')
      .eq('status', 'worked')
      .gte('work_date', start)
      .lte('work_date', end),
    supabase
      .from('pay_rates')
      .select('staff_id, effective_from, hourly_wage, commute_allowance, other_allowance')
      .order('effective_from', { ascending: false }),
  ]);
  if (staffRes.error) throw staffRes.error;
  if (entryRes.error) throw entryRes.error;
  if (rateRes.error) throw rateRes.error;

  type Rate = { effectiveFrom: string; wage: number; commute: number; other: number };
  const ratesByStaff = new Map<string, Rate[]>();
  for (const r of rateRes.data ?? []) {
    const arr = ratesByStaff.get(r.staff_id) ?? [];
    arr.push({
      effectiveFrom: r.effective_from,
      wage: Number(r.hourly_wage),
      commute: Number(r.commute_allowance),
      other: Number(r.other_allowance),
    });
    ratesByStaff.set(r.staff_id, arr);
  }
  // 勤務日時点で有効な時給（effective_from <= 日付 の最新、降順配列の先頭一致）。
  const wageOn = (staffId: string, date: string): number => {
    const arr = ratesByStaff.get(staffId) ?? [];
    return arr.find((r) => r.effectiveFrom <= date)?.wage ?? 0;
  };
  // 月末時点で有効な手当（月額）。
  const allowanceOf = (staffId: string): number => {
    const arr = ratesByStaff.get(staffId) ?? [];
    const r = arr.find((x) => x.effectiveFrom <= end);
    return r ? r.commute + r.other : 0;
  };

  const acc = new Map<string, { workedMin: number; basePay: number }>();
  for (const e of entryRes.data ?? []) {
    const min = Math.max(0, toMin(hhmm(e.end_time)) - toMin(hhmm(e.start_time)) - (e.break_min ?? 0));
    const cur = acc.get(e.staff_id) ?? { workedMin: 0, basePay: 0 };
    cur.workedMin += min;
    cur.basePay += (min / 60) * wageOn(e.staff_id, e.work_date);
    acc.set(e.staff_id, cur);
  }

  return (staffRes.data ?? []).map((s) => {
    const cur = acc.get(s.id) ?? { workedMin: 0, basePay: 0 };
    return {
      staffId: s.id,
      workedMin: cur.workedMin,
      basePay: Math.round(cur.basePay),
      allowance: allowanceOf(s.id),
    };
  });
}

export type PayslipRow = {
  staff: { id: string; initial: string; name: string; tone: Tone };
  workedMin: number;
  basePay: number;
  allowance: number;
  deduction: number;
  adjustment: number;
  gross: number;
  net: number;
  payslipId: string;
};

export type PayrollRunData = {
  period: string;
  status: 'draft' | 'confirmed';
  confirmedAt: string | null;
  slips: PayslipRow[];
  totalGross: number;
  totalNet: number;
};

/** 保存済みの月次給与（run＋明細）を返す。未計算なら null。 */
export async function getPayrollRun(period: string): Promise<PayrollRunData | null> {
  const supabase = await createClient();
  const { data: run, error } = await supabase
    .from('payroll_runs')
    .select('id, period, status, confirmed_at')
    .eq('period', period)
    .maybeSingle();
  if (error) throw error;
  if (!run) return null;

  const { data: slips, error: e2 } = await supabase
    .from('payslips')
    .select('id, worked_min, base_pay, allowance, deduction, adjustment, gross_pay, net_pay, staff(id, initial, name, tone)')
    .eq('run_id', run.id);
  if (e2) throw e2;

  const rows: PayslipRow[] = (slips ?? []).map((p) => {
    const rel = p.staff as unknown;
    const st = (Array.isArray(rel) ? rel[0] : rel) as { id: string; initial: string; name: string; tone: Tone } | null;
    return {
      staff: { id: st?.id ?? '', initial: st?.initial ?? '', name: st?.name ?? '', tone: (st?.tone ?? 'accent') as Tone },
      workedMin: p.worked_min,
      basePay: Number(p.base_pay),
      allowance: Number(p.allowance),
      deduction: Number(p.deduction),
      adjustment: Number(p.adjustment),
      gross: Number(p.gross_pay),
      net: Number(p.net_pay),
      payslipId: p.id,
    };
  });
  rows.sort((a, b) => a.staff.name.localeCompare(b.staff.name));

  return {
    period: run.period,
    status: run.status as 'draft' | 'confirmed',
    confirmedAt: run.confirmed_at,
    slips: rows,
    totalGross: rows.reduce((s, r) => s + r.gross, 0),
    totalNet: rows.reduce((s, r) => s + r.net, 0),
  };
}

export type MyPayslip = {
  period: string;
  status: 'draft' | 'confirmed';
  workedMin: number;
  basePay: number;
  allowance: number;
  deduction: number;
  adjustment: number;
  gross: number;
  net: number;
};

/** ログイン中スタッフ本人の給与明細を月降順で返す（RLS で自分の分のみ）。 */
export async function getMyPayslips(staffId: string): Promise<MyPayslip[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('payslips')
    .select('worked_min, base_pay, allowance, deduction, adjustment, gross_pay, net_pay, payroll_runs(period, status)')
    .eq('staff_id', staffId);
  if (error) throw error;

  const rows: MyPayslip[] = (data ?? []).map((p) => {
    const rel = p.payroll_runs as unknown;
    const run = (Array.isArray(rel) ? rel[0] : rel) as { period: string; status: 'draft' | 'confirmed' } | null;
    return {
      period: run?.period ?? '',
      status: (run?.status ?? 'draft') as 'draft' | 'confirmed',
      workedMin: p.worked_min,
      basePay: Number(p.base_pay),
      allowance: Number(p.allowance),
      deduction: Number(p.deduction),
      adjustment: Number(p.adjustment),
      gross: Number(p.gross_pay),
      net: Number(p.net_pay),
    };
  });
  rows.sort((a, b) => b.period.localeCompare(a.period));
  return rows;
}

export async function getStaff(): Promise<Staff[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('staff')
    .select('id, name, initial, tone, weekly_hours')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    initial: r.initial,
    tone: r.tone as Tone,
    weeklyHours: r.weekly_hours,
  }));
}

/** 週テンプレート（shifts）を staff 単位の ShiftRow[]（Mon..Sun）に組み立てる。 */
export async function getShiftRows(): Promise<ShiftRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('staff')
    .select(
      'initial, name, tone, weekly_hours, shifts (weekday, start_time, end_time, tone)',
    )
    .order('created_at', { ascending: true });
  if (error) throw error;

  return (data ?? []).map((s) => {
    const days: ShiftCell[] = Array(7).fill(null);
    for (const sh of (s.shifts ?? []) as {
      weekday: number;
      start_time: string;
      end_time: string;
      tone: Tone;
    }[]) {
      days[sh.weekday] = {
        start: hhmm(sh.start_time),
        end: hhmm(sh.end_time),
        tone: sh.tone,
      };
    }
    return {
      staff: {
        initial: s.initial,
        name: s.name,
        tone: s.tone as Tone,
        weeklyHours: s.weekly_hours,
      },
      days,
    };
  });
}

/** 指定日（既定: 今日）の予約を ScheduleEntry[] で返す。 */
export async function getTodaySchedule(
  date = new Date().toISOString().slice(0, 10),
): Promise<ScheduleEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bookings')
    .select(
      'id, start_time, duration_min, customer_name, service_key, tone, staff (initial, name)',
    )
    .eq('booking_date', date)
    .order('start_time', { ascending: true });
  if (error) throw error;

  return (data ?? []).map((b) => {
    // supabase-js は to-one リレーションを配列として型付けすることがあるため正規化。
    const rel = b.staff as unknown;
    const st = (Array.isArray(rel) ? rel[0] : rel) as
      | { initial: string; name: string }
      | null;
    return {
      id: b.id,
      time: hhmm(b.start_time),
      customer: b.customer_name,
      serviceKey: (b.service_key ?? 'svcCut') as ScheduleEntry['serviceKey'],
      durationMin: b.duration_min,
      staffInitial: st?.initial ?? '',
      staffName: st?.name ?? '',
      tone: b.tone as Tone,
    };
  });
}

export async function getFollowUps(): Promise<FollowUp[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('follow_ups')
    .select('id, initial, customer_name, tone, first_visit_date, status')
    .order('first_visit_date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((f) => ({
    id: f.id,
    initial: f.initial,
    name: f.customer_name,
    tone: f.tone as Tone,
    firstVisitDate: f.first_visit_date,
    status: f.status as FollowUp['status'],
  }));
}

export async function getStockItems(): Promise<StockItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('inventory_items')
    .select('id, name, category_key, stock, capacity, reorder_pt, status, supplier')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((i) => ({
    id: i.id,
    name: i.name,
    categoryKey: i.category_key as StockItem['categoryKey'],
    stock: i.stock,
    capacity: i.capacity,
    reorderPt: i.reorder_pt,
    status: i.status as StockItem['status'],
    supplier: i.supplier ?? '',
  }));
}

export async function getOrders(): Promise<OrderRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('orders')
    .select('id, item, qty, supplier, order_date, eta, status')
    .order('order_date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((o) => ({
    id: o.id,
    item: o.item,
    qty: o.qty,
    supplier: o.supplier,
    orderDate: md(o.order_date),
    eta: o.eta ? md(o.eta) : '',
    status: o.status as OrderRow['status'],
  }));
}

export async function getCustomerList(): Promise<CustomerListItem[]> {
  const supabase = await createClient();
  const [{ data, error }, follow] = await Promise.all([
    supabase
      .from('customers')
      .select('id, initial, name, tone, visits, last_visit, email')
      .order('last_visit', { ascending: false }),
    supabase.from('follow_ups').select('customer_id, customer_name').eq('status', 'send'),
  ]);
  if (error) throw error;

  // 要フォロー判定用の集合（customer_id 優先、無ければ表示名で照合）。
  const followIds = new Set<string>();
  const followNames = new Set<string>();
  for (const f of follow.data ?? []) {
    if (f.customer_id) followIds.add(f.customer_id as string);
    if (f.customer_name) followNames.add(f.customer_name as string);
  }

  return (data ?? []).map((c) => ({
    id: c.id,
    initial: c.initial,
    name: c.name,
    tone: c.tone as Tone,
    visits: c.visits,
    date: c.last_visit ? md(c.last_visit) : '',
    hasEmail: !!c.email,
    // 新規 = 来店1回以下、要フォロー = フォロー送信予定が残っている顧客。
    segmentNew: (c.visits ?? 0) <= 1,
    segmentFollow: followIds.has(c.id) || followNames.has(c.name),
  }));
}

export type DashboardMetrics = {
  todayBookings: number;
  todayBookingsDelta: string;
  staffOnShift: number;
  staffTotal: number;
  needsFollow: number;
  lowStock: number;
};

/** ダッシュボード上部の集計値を一括取得。 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = await createClient();
  const now = new Date();
  const todayStr = ymd(now);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = ymd(yesterday);
  const weekday = weekdayMonFirst(now);

  const head = { count: 'exact' as const, head: true };
  const [staffTotal, onShift, todayB, yB, needsFollow, lowStock] = await Promise.all([
    supabase.from('staff').select('id', head),
    supabase.from('shifts').select('id', head).eq('weekday', weekday),
    supabase.from('bookings').select('id', head).eq('booking_date', todayStr),
    supabase.from('bookings').select('id', head).eq('booking_date', yesterdayStr),
    supabase.from('follow_ups').select('id', head).eq('status', 'send'),
    supabase.from('inventory_items').select('id', head).in('status', ['low', 'order']),
  ]);

  const tb = todayB.count ?? 0;
  const delta = tb - (yB.count ?? 0);
  return {
    todayBookings: tb,
    todayBookingsDelta: `${delta >= 0 ? '+' : ''}${delta}`,
    staffOnShift: onShift.count ?? 0,
    staffTotal: staffTotal.count ?? 0,
    needsFollow: needsFollow.count ?? 0,
    lowStock: lowStock.count ?? 0,
  };
}

/** 在庫アラート（low/order のみ）。pct = 在庫 / 容量。 */
export async function getStockAlerts(): Promise<StockAlert[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('inventory_items')
    .select('id, name, stock, capacity, status')
    .in('status', ['low', 'order'])
    .order('stock', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((i) => ({
    id: i.id,
    nameKey: null,
    name: i.name,
    pct: i.capacity ? Math.round((i.stock / i.capacity) * 100) : 0,
  }));
}

/** 顧客数サマリ（合計 / 連絡先登録済み）。 */
export async function getCustomerCount(): Promise<{ total: number; withContact: number }> {
  const supabase = await createClient();
  const head = { count: 'exact' as const, head: true };
  const [total, withContact] = await Promise.all([
    supabase.from('customers').select('id', head),
    supabase.from('customers').select('id', head).not('email', 'is', null),
  ]);
  return { total: total.count ?? 0, withContact: withContact.count ?? 0 };
}

/** 顧客詳細（指定 id、無指定なら最終来店が最新の1件）＋メモ＋担当。 */
export async function getCustomerDetail(id?: string): Promise<CustomerDetail | null> {
  const supabase = await createClient();
  let q = supabase
    .from('customers')
    .select(
      'id, initial, name, tone, email, phone, visits, last_visit, lifetime_spend, primary_staff:staff!primary_staff_id(initial,name,tone)',
    );
  q = id ? q.eq('id', id) : q.order('last_visit', { ascending: false });
  const { data, error } = await q.limit(1).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const rel = data.primary_staff as unknown;
  const ps = (Array.isArray(rel) ? rel[0] : rel) as
    | { initial: string; name: string; tone: Tone }
    | null;

  const { data: memos } = await supabase
    .from('customer_memos')
    .select('memo_date, staff_name, tone, text')
    .eq('customer_id', data.id)
    .order('memo_date', { ascending: false });

  return {
    id: data.id,
    initial: data.initial,
    name: data.name,
    tone: data.tone as Tone,
    email: data.email ?? '',
    phone: data.phone ?? '',
    visits: data.visits,
    lastVisit: data.last_visit ? md(data.last_visit) : '—',
    spend: data.lifetime_spend != null ? `$${Number(data.lifetime_spend).toLocaleString('en-US')}` : '—',
    primaryStaff: {
      initial: ps?.initial ?? '',
      name: ps?.name ?? '',
      tone: (ps?.tone ?? 'accent') as Tone,
    },
    memos: (memos ?? []).map((m) => ({
      date: md(m.memo_date),
      staff: m.staff_name ?? '',
      tone: m.tone as Tone,
      text: m.text,
    })),
  };
}

export type BookingColumnStaff = { initial: string; name: string; tone: Tone };

/** 30分=1スロット。9:00 を rowStart 2 とするグリッド行番号を返す。 */
function rowStartFromTime(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return 2 + (h - 9) * 2 + (m >= 30 ? 1 : 0);
}

/** 指定日（既定: 今日）の予約タイムライン。スタッフ列とブロックを返す。 */
export async function getBookings(
  date = ymd(new Date()),
): Promise<{ staff: BookingColumnStaff[]; blocks: BookingBlock[] }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bookings')
    .select('id, start_time, duration_min, customer_name, service_key, tone, staff(id, initial, name, tone)')
    .eq('booking_date', date)
    .order('start_time', { ascending: true });
  if (error) throw error;

  const columns: BookingColumnStaff[] = [];
  const colIndex = new Map<string, number>();
  const blocks: BookingBlock[] = [];

  for (const b of data ?? []) {
    const rel = b.staff as unknown;
    const st = (Array.isArray(rel) ? rel[0] : rel) as
      | { id: string; initial: string; name: string; tone: Tone }
      | null;
    if (!st) continue;

    if (!colIndex.has(st.id)) {
      colIndex.set(st.id, columns.length);
      columns.push({ initial: st.initial, name: st.name, tone: st.tone });
    }
    const col = colIndex.get(st.id)! + 1; // 1-based

    blocks.push({
      id: b.id,
      col,
      rowStart: rowStartFromTime(b.start_time),
      rowSpan: Math.max(1, Math.ceil(b.duration_min / 30)),
      time: hhmm(b.start_time),
      customer: b.customer_name,
      serviceKey: (b.service_key ?? undefined) as BookingBlock['serviceKey'],
      tone: b.tone as Tone,
    });
  }

  return { staff: columns, blocks };
}

export type SalesPeriod = 'month' | 'lastMonth' | 'year';

export type SalesData = {
  period: SalesPeriod;
  /** 当日の積み上げ（毎日の売上入力導線用）。 */
  today: { revenue: number; count: number };
  summary: SalesSummary;
  trend: SalesMonthBar[];
  categories: SalesCategory[];
  staffRank: SalesStaffRank[];
  txns: SalesTxn[];
};

const CATEGORY_TONE: Record<string, Tone> = {
  svcColor: 'accent',
  svcCut: 'sage',
  svcSpa: 'rose',
  svcCutColor: 'accent',
  salesRetail: 'accent',
};

type TxnRow = {
  id: string;
  txn_date: string;
  customer_name: string;
  service_key: string | null;
  category: 'service' | 'retail';
  amount: number;
  staff: { initial: string; name: string; tone: Tone } | null;
};

/** 6ヶ月分のゼロ推移＋空集計（transactions テーブル未作成時のフォールバック）。 */
function emptySales(now: Date, period: SalesPeriod): SalesData {
  const trend: SalesMonthBar[] = [];
  for (let i = 5; i >= 0; i--) {
    trend.push({ month: new Date(now.getFullYear(), now.getMonth() - i, 1).getMonth() + 1, value: 0 });
  }
  return {
    period,
    today: { revenue: 0, count: 0 },
    summary: { monthRevenue: 0, monthRevenueDelta: 0, avgSpend: 0, transactions: 0, serviceRevenue: 0, retailRevenue: 0 },
    trend,
    categories: [],
    staffRank: [],
    txns: [],
  };
}

/** 売上ページ用の集計一式（選択期間サマリ / 6ヶ月推移 / カテゴリ別 / スタッフ別 / 直近取引）。 */
export async function getSales(period: SalesPeriod = 'month'): Promise<SalesData> {
  const supabase = await createClient();
  const now = new Date();
  // 推移は直近6ヶ月、「今年」期間は年初まで遡る必要があるため早い方を起点にする。
  const sixAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const since = sixAgo < yearStart ? sixAgo : yearStart;
  const { data, error } = await supabase
    .from('transactions')
    .select('id, txn_date, customer_name, service_key, category, amount, staff(initial, name, tone)')
    .gte('txn_date', ymd(since))
    .order('txn_date', { ascending: false });
  // transactions マイグレーション未適用時はテーブルが無いので空集計でフォールバック。
  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205' || /does not exist|find the table/i.test(error.message)) {
      return emptySales(now, period);
    }
    throw error;
  }

  const rows: TxnRow[] = (data ?? []).map((r) => {
    const rel = r.staff as unknown;
    const st = (Array.isArray(rel) ? rel[0] : rel) as TxnRow['staff'];
    return {
      id: r.id,
      txn_date: r.txn_date,
      customer_name: r.customer_name,
      service_key: r.service_key,
      category: r.category,
      amount: Number(r.amount),
      staff: st,
    };
  });

  const ym = (d: string) => d.slice(0, 7); // 'YYYY-MM'
  const yr = (d: string) => d.slice(0, 4); // 'YYYY'
  const thisMonth = ym(ymd(now));
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = ym(ymd(lastMonthDate));
  const prevOfLast = ym(ymd(new Date(now.getFullYear(), now.getMonth() - 2, 1)));
  const thisYear = String(now.getFullYear());

  // 選択期間の行と、前年同種期間（前月比/前年比）の行を切り出す。
  const inPeriod = (r: TxnRow): boolean =>
    period === 'year' ? yr(r.txn_date) === thisYear : ym(r.txn_date) === (period === 'lastMonth' ? lastMonth : thisMonth);
  const prevKey = period === 'year' ? String(now.getFullYear() - 1) : period === 'lastMonth' ? prevOfLast : lastMonth;
  const inPrev = (r: TxnRow): boolean =>
    period === 'year' ? yr(r.txn_date) === prevKey : ym(r.txn_date) === prevKey;

  const periodRows = rows.filter(inPeriod);

  // --- 当日の積み上げ ---
  const todayKey = ymd(now);
  const todayRows = rows.filter((r) => r.txn_date === todayKey);
  const today = {
    revenue: Math.round(todayRows.reduce((s, r) => s + r.amount, 0)),
    count: todayRows.length,
  };

  // --- summary（選択期間） ---
  const periodRevenue = periodRows.reduce((s, r) => s + r.amount, 0);
  const serviceRevenue = periodRows.filter((r) => r.category === 'service').reduce((s, r) => s + r.amount, 0);
  const retailRevenue = periodRows.filter((r) => r.category === 'retail').reduce((s, r) => s + r.amount, 0);
  const transactions = periodRows.length;
  const prevRevenue = rows.filter(inPrev).reduce((s, r) => s + r.amount, 0);
  const summary: SalesSummary = {
    monthRevenue: Math.round(periodRevenue),
    monthRevenueDelta: prevRevenue ? Math.round(((periodRevenue - prevRevenue) / prevRevenue) * 100) : 0,
    avgSpend: transactions ? Math.round(periodRevenue / transactions) : 0,
    transactions,
    serviceRevenue: Math.round(serviceRevenue),
    retailRevenue: Math.round(retailRevenue),
  };

  // --- trend（6ヶ月） ---
  const byMonth = new Map<number, number>();
  for (const r of rows) {
    const mo = Number(r.txn_date.slice(5, 7));
    byMonth.set(mo, (byMonth.get(mo) ?? 0) + r.amount);
  }
  const trend: SalesMonthBar[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mo = d.getMonth() + 1;
    trend.push({ month: mo, value: Math.round(byMonth.get(mo) ?? 0) });
  }

  // --- categories（選択期間） ---
  const catMap = new Map<string, number>();
  for (const r of periodRows) {
    const key = r.category === 'retail' ? 'salesRetail' : r.service_key ?? 'svcCut';
    catMap.set(key, (catMap.get(key) ?? 0) + r.amount);
  }
  const categories: SalesCategory[] = [...catMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, amount], i) => ({
      id: `sc${i + 1}`,
      nameKey: key as LabelKey,
      amount: Math.round(amount),
      pct: periodRevenue ? Math.round((amount / periodRevenue) * 100) : 0,
      tone: CATEGORY_TONE[key] ?? 'accent',
    }));

  // --- staffRank（選択期間） ---
  const staffMap = new Map<string, { initial: string; name: string; tone: Tone; amount: number }>();
  for (const r of periodRows) {
    if (!r.staff) continue;
    const cur = staffMap.get(r.staff.name) ?? { ...r.staff, amount: 0 };
    cur.amount += r.amount;
    staffMap.set(r.staff.name, cur);
  }
  const staffRank: SalesStaffRank[] = [...staffMap.values()]
    .sort((a, b) => b.amount - a.amount)
    .map((s, i) => ({
      id: `sr${i + 1}`,
      initial: s.initial,
      name: s.name,
      tone: s.tone,
      amount: Math.round(s.amount),
      share: periodRevenue ? Math.round((s.amount / periodRevenue) * 100) : 0,
    }));

  // --- txns（選択期間の直近8件） ---
  const txns: SalesTxn[] = periodRows.slice(0, 8).map((r) => ({
    id: r.id,
    date: md(r.txn_date),
    customer: r.customer_name,
    serviceKey: (r.service_key ?? 'svcCut') as LabelKey,
    staffInitial: r.staff?.initial ?? '',
    staffName: r.staff?.name ?? '',
    tone: r.staff?.tone ?? 'accent',
    amount: Math.round(r.amount),
  }));

  return { period, today, summary, trend, categories, staffRank, txns };
}
