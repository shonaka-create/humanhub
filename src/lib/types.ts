// Domain model for the HUMAN-HUB salon system.
// Field names are kept generic so the mock layer can later be replaced by
// Supabase tables/rows with minimal mapping.

import type { Dict } from '@/i18n/dict';

/** Visual tone used across avatars, chips and schedule blocks. */
export type Tone = 'accent' | 'sage' | 'rose';

/** Keys into the i18n dictionary (used for translatable labels in data). */
export type LabelKey = keyof Dict;

/** アカウント権限。オーナーは全編集＋給与確定、スタッフは自分の情報のみ。 */
export type StaffRole = 'owner' | 'staff';

export type Staff = {
  id: string;
  name: string;
  initial: string;
  tone: Tone;
  weeklyHours: number;
  /** 紐付け用メールアドレス（memberships.email と一致すると自動でアカウント紐付け）。 */
  email: string;
  /** ログインアカウントと紐付け済みか（staff.user_id が設定されている）。 */
  linked: boolean;
};

/** 給与テーブル1件（スタッフ×適用開始日）。金額は円。 */
export type PayRate = {
  id: string;
  staffId: string;
  effectiveFrom: string;
  hourlyWage: number;
  commuteAllowance: number;
  otherAllowance: number;
  note: string;
};

/** シフト実績の状態。worked=出勤 / off=休み / paid_leave=有給。 */
export type ShiftStatus = 'worked' | 'off' | 'paid_leave';

/** 日付ベースのシフト実績1件（給与の実働時間の源泉）。 */
export type ShiftEntry = {
  id: string;
  staffId: string;
  date: string;
  start: string;
  end: string;
  breakMin: number;
  status: ShiftStatus;
  note: string;
  tone: Tone;
};

/** 週グリッドの1セル（該当日の実績、無ければ null）。 */
export type ShiftEntryCell = {
  id: string;
  start: string;
  end: string;
  breakMin: number;
  status: ShiftStatus;
  tone: Tone;
  note: string;
} | null;

/** 週グリッドのスタッフ1行（days は Mon..Sun、workedMin は当週の実働合計分）。 */
export type ShiftWeekRow = {
  staff: { id: string; initial: string; name: string; tone: Tone };
  days: ShiftEntryCell[];
  workedMin: number;
};

export type ScheduleEntry = {
  id: string;
  time: string;
  customer: string;
  serviceKey: LabelKey;
  durationMin: number;
  staffInitial: string;
  staffName: string;
  tone: Tone;
};

export type FollowUp = {
  id: string;
  initial: string;
  name: string;
  tone: Tone;
  firstVisitDate: string;
  status: 'send' | 'sent';
};

export type StockAlert = {
  id: string;
  nameKey: LabelKey | null;
  name?: string;
  pct: number;
};

export type ShiftCell = { start: string; end: string; tone: Tone } | null;

export type ShiftRow = {
  staff: Pick<Staff, 'initial' | 'name' | 'tone' | 'weeklyHours'>;
  /** Mon..Sun */
  days: ShiftCell[];
};

export type BookingBlock = {
  id: string;
  /** 1-based staff column index */
  col: number;
  /** CSS grid-row start (row 2 == 9:00) */
  rowStart: number;
  /** number of 30-min rows */
  rowSpan: number;
  time: string;
  customer: string;
  serviceKey?: LabelKey;
  tone: Tone;
};

export type CustomerListItem = {
  id: string;
  initial: string;
  name: string;
  tone: Tone;
  /** translatable meta key (e.g. tagFirst) shown before the date */
  metaKey?: LabelKey;
  /** literal visit count meta (e.g. "12") shown with uVisit unit */
  visits?: number;
  date: string;
  active?: boolean;
  unread?: boolean;
  hasEmail: boolean;
  segmentNew?: boolean;
  segmentFollow?: boolean;
};

export type CustomerMemo = {
  date: string;
  staff: string;
  tone: Tone;
  text: string;
};

export type CustomerDetail = {
  id: string;
  initial: string;
  name: string;
  tone: Tone;
  email: string;
  phone: string;
  visits: number;
  lastVisit: string;
  spend: string;
  primaryStaffId: string;
  primaryStaff: { initial: string; name: string; tone: Tone };
  memos: CustomerMemo[];
};

export type InventoryStatus = 'ok' | 'low' | 'order' | 'ordered';

export type StockItem = {
  id: string;
  name: string;
  categoryKey: LabelKey;
  stock: number;
  capacity: number;
  reorderPt: number;
  status: InventoryStatus;
  /** 仕入先（どこで買うか）。未設定なら空文字。 */
  supplier: string;
};

export type OrderStatus = 'ordered' | 'shipping' | 'arrived';

export type OrderRow = {
  id: string;
  item: string;
  qty: string;
  supplier: string;
  /** 表示用（'M/D'）。編集フォームには *ISO を使う。 */
  orderDate: string;
  eta: string;
  /** 'YYYY-MM-DD'（date input 用の生値）。 */
  orderDateISO: string;
  etaISO: string;
  status: OrderStatus;
};

// ---- Sales ----

/** Headline figures for the current period (amounts in whole dollars). */
export type SalesSummary = {
  monthRevenue: number;
  /** % change vs. the previous month (can be negative) */
  monthRevenueDelta: number;
  avgSpend: number;
  transactions: number;
  serviceRevenue: number;
  retailRevenue: number;
};

/** One bar in the revenue trend chart. `month` is 1-based. */
export type SalesMonthBar = { month: number; value: number };

/** Revenue split by service/retail category. */
export type SalesCategory = {
  id: string;
  nameKey: LabelKey;
  amount: number;
  pct: number;
  tone: Tone;
};

/** Sales attributed to a single staff member. */
export type SalesStaffRank = {
  id: string;
  initial: string;
  name: string;
  tone: Tone;
  amount: number;
  /** share of total revenue, % */
  share: number;
};

/** A single recorded transaction. */
export type SalesTxn = {
  id: string;
  date: string;
  customer: string;
  serviceKey: LabelKey;
  staffInitial: string;
  staffName: string;
  tone: Tone;
  amount: number;
};
