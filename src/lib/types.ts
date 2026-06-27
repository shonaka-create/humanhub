// Domain model for the HUMAN-HUB salon system.
// Field names are kept generic so the mock layer can later be replaced by
// Supabase tables/rows with minimal mapping.

import type { Dict } from '@/i18n/dict';

/** Visual tone used across avatars, chips and schedule blocks. */
export type Tone = 'accent' | 'sage' | 'rose';

/** Keys into the i18n dictionary (used for translatable labels in data). */
export type LabelKey = keyof Dict;

export type Staff = {
  id: string;
  name: string;
  initial: string;
  tone: Tone;
  weeklyHours: number;
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
};

export type OrderStatus = 'ordered' | 'shipping' | 'arrived';

export type OrderRow = {
  id: string;
  item: string;
  qty: string;
  supplier: string;
  orderDate: string;
  eta: string;
  status: OrderStatus;
};
