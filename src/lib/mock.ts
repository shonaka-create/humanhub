// Mock data ported from the Claude Design source. Replace these arrays with
// Supabase queries later — page components only depend on the typed shapes.

import type {
  BookingBlock,
  CustomerDetail,
  CustomerListItem,
  FollowUp,
  OrderRow,
  SalesCategory,
  SalesMonthBar,
  SalesStaffRank,
  SalesSummary,
  SalesTxn,
  ScheduleEntry,
  ShiftRow,
  Staff,
  StockAlert,
  StockItem,
} from './types';

export const staff: Staff[] = [
  { id: 'emma', name: 'Emma', initial: 'E', tone: 'sage', weeklyHours: 32, email: '', linked: false },
  { id: 'aoi', name: 'Aoi', initial: 'A', tone: 'accent', weeklyHours: 30, email: '', linked: false },
  { id: 'mei', name: 'Mei', initial: 'M', tone: 'rose', weeklyHours: 24, email: '', linked: false },
  { id: 'yuki', name: 'Yuki', initial: 'Y', tone: 'accent', weeklyHours: 38, email: '', linked: false },
  { id: 'liam', name: 'Liam', initial: 'L', tone: 'sage', weeklyHours: 26, email: '', linked: false },
  { id: 'sophie', name: 'Sophie', initial: 'S', tone: 'sage', weeklyHours: 20, email: '', linked: false },
];

export const todaySchedule: ScheduleEntry[] = [
  { id: 's1', time: '09:30', customer: '山田 花子', serviceKey: 'svcCutColor', durationMin: 90, staffInitial: 'E', staffName: 'Emma', tone: 'sage' },
  { id: 's2', time: '10:00', customer: '佐藤 美咲', serviceKey: 'svcSpa', durationMin: 60, staffInitial: 'A', staffName: 'Aoi', tone: 'accent' },
  { id: 's3', time: '11:30', customer: 'Olivia Chen', serviceKey: 'svcCut', durationMin: 45, staffInitial: 'E', staffName: 'Emma', tone: 'sage' },
  { id: 's4', time: '13:00', customer: '田中 葵', serviceKey: 'svcColor', durationMin: 75, staffInitial: 'M', staffName: 'Mei', tone: 'rose' },
  { id: 's5', time: '15:30', customer: 'Sophie Müller', serviceKey: 'svcSpa', durationMin: 60, staffInitial: 'A', staffName: 'Aoi', tone: 'accent' },
];

export const followUps: FollowUp[] = [
  { id: 'f1', initial: '山', name: '山本 結衣', tone: 'accent', firstVisitDate: '6/24', status: 'send' },
  { id: 'f2', initial: 'J', name: 'James Lee', tone: 'accent', firstVisitDate: '6/24', status: 'send' },
  { id: 'f3', initial: '中', name: '中村 桃子', tone: 'sage', firstVisitDate: '6/23', status: 'sent' },
];

export const stockAlerts: StockAlert[] = [
  { id: 'a1', nameKey: 'itemColor', name: '6N', pct: 12 },
  { id: 'a2', nameKey: 'itemFoil', pct: 20 },
];

export const dashboardMetrics = {
  todayBookings: 8,
  todayBookingsDelta: '+2',
  staffOnShift: 4,
  staffTotal: 6,
  needsFollow: 3,
  lowStock: 2,
};

// ---- Shifts (Mon..Sun) ----
const off = null;
export const shiftRows: ShiftRow[] = [
  {
    staff: { initial: 'E', name: 'Emma', tone: 'sage', weeklyHours: 32 },
    days: [
      { start: '9:00', end: '17:00', tone: 'accent' },
      { start: '9:00', end: '17:00', tone: 'accent' },
      off,
      { start: '9:00', end: '17:00', tone: 'accent' },
      { start: '9:00', end: '17:00', tone: 'accent' },
      { start: '9:00', end: '14:00', tone: 'sage' },
      off,
    ],
  },
  {
    staff: { initial: 'A', name: 'Aoi', tone: 'accent', weeklyHours: 30 },
    days: [
      off,
      { start: '12:00', end: '20:00', tone: 'rose' },
      { start: '12:00', end: '20:00', tone: 'rose' },
      { start: '10:00', end: '18:00', tone: 'accent' },
      { start: '10:00', end: '18:00', tone: 'accent' },
      off,
      { start: '10:00', end: '18:00', tone: 'accent' },
    ],
  },
  {
    staff: { initial: 'M', name: 'Mei', tone: 'rose', weeklyHours: 24 },
    days: [
      { start: '9:00', end: '14:00', tone: 'sage' },
      off,
      { start: '9:00', end: '14:00', tone: 'sage' },
      off,
      { start: '9:00', end: '14:00', tone: 'sage' },
      { start: '10:00', end: '18:00', tone: 'accent' },
      { start: '10:00', end: '18:00', tone: 'accent' },
    ],
  },
  {
    staff: { initial: 'Y', name: 'Yuki', tone: 'accent', weeklyHours: 38 },
    days: [
      { start: '9:00', end: '18:00', tone: 'accent' },
      { start: '9:00', end: '18:00', tone: 'accent' },
      { start: '9:00', end: '18:00', tone: 'accent' },
      off,
      { start: '9:00', end: '18:00', tone: 'accent' },
      { start: '9:00', end: '18:00', tone: 'accent' },
      off,
    ],
  },
  {
    staff: { initial: 'L', name: 'Liam', tone: 'sage', weeklyHours: 26 },
    days: [
      off,
      { start: '12:00', end: '20:00', tone: 'rose' },
      { start: '12:00', end: '20:00', tone: 'rose' },
      { start: '11:00', end: '19:00', tone: 'accent' },
      off,
      { start: '11:00', end: '19:00', tone: 'accent' },
      { start: '12:00', end: '20:00', tone: 'rose' },
    ],
  },
  {
    staff: { initial: 'S', name: 'Sophie', tone: 'sage', weeklyHours: 20 },
    days: [
      { start: '10:00', end: '15:00', tone: 'sage' },
      off,
      { start: '10:00', end: '15:00', tone: 'sage' },
      off,
      off,
      { start: '10:00', end: '18:00', tone: 'accent' },
      off,
    ],
  },
];

// ---- Bookings (day timeline). Staff columns: Emma, Aoi, Mei, Liam ----
export const bookingStaff = [
  { initial: 'E', name: 'Emma', tone: 'sage' as const },
  { initial: 'A', name: 'Aoi', tone: 'accent' as const },
  { initial: 'M', name: 'Mei', tone: 'rose' as const },
  { initial: 'L', name: 'Liam', tone: 'sage' as const },
];

export const bookingBlocks: BookingBlock[] = [
  { id: 'b1', col: 1, rowStart: 3, rowSpan: 3, time: '9:30', customer: '山田 花子', serviceKey: 'svcCutColor', tone: 'sage' },
  { id: 'b2', col: 1, rowStart: 7, rowSpan: 2, time: '11:30', customer: 'Olivia Chen', tone: 'sage' },
  { id: 'b3', col: 1, rowStart: 12, rowSpan: 3, time: '14:00', customer: '伊藤 さくら', serviceKey: 'svcColor', tone: 'sage' },
  { id: 'b4', col: 2, rowStart: 4, rowSpan: 2, time: '10:00', customer: '佐藤 美咲', serviceKey: 'svcSpa', tone: 'accent' },
  { id: 'b5', col: 2, rowStart: 9, rowSpan: 3, time: '12:30', customer: '渡辺 葵', serviceKey: 'svcCutColor', tone: 'accent' },
  { id: 'b6', col: 2, rowStart: 16, rowSpan: 2, time: '16:00', customer: 'Emily Brown', tone: 'accent' },
  { id: 'b7', col: 3, rowStart: 10, rowSpan: 3, time: '13:00', customer: '田中 葵', serviceKey: 'svcColor', tone: 'rose' },
  { id: 'b8', col: 3, rowStart: 15, rowSpan: 2, time: '15:30', customer: '小林 美月', tone: 'rose' },
  { id: 'b9', col: 4, rowStart: 8, rowSpan: 2, time: '12:00', customer: 'James Lee', tone: 'sage' },
  { id: 'b10', col: 4, rowStart: 15, rowSpan: 2, time: '15:30', customer: 'Sophie Müller', serviceKey: 'svcSpa', tone: 'sage' },
  { id: 'b11', col: 4, rowStart: 20, rowSpan: 2, time: '18:00', customer: '中村 桃子', tone: 'sage' },
];
export const bookingHours = ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

// ---- Customers ----
export const customerCount = { total: 24, withContact: 18 };

export const customerList: CustomerListItem[] = [
  { id: 'c1', initial: '山', name: '山本 結衣', tone: 'accent', metaKey: 'tagFirst', date: '6/24', active: true, unread: true, hasEmail: true, segmentNew: true, segmentFollow: true },
  { id: 'c2', initial: 'J', name: 'James Lee', tone: 'sage', metaKey: 'tagFirst', date: '6/24', unread: true, hasEmail: false, segmentNew: true, segmentFollow: true },
  { id: 'c3', initial: '佐', name: '佐藤 美咲', tone: 'rose', visits: 12, date: '6/20', hasEmail: true },
  { id: 'c4', initial: 'O', name: 'Olivia Chen', tone: 'accent', visits: 5, date: '6/18', hasEmail: true },
  { id: 'c5', initial: '田', name: '田中 葵', tone: 'sage', visits: 8, date: '6/15', hasEmail: true },
];

export const customerDetail: CustomerDetail = {
  id: 'c1',
  initial: '山',
  name: '山本 結衣',
  tone: 'accent',
  email: 'yui.yamamoto@email.com',
  phone: '0412 345 678',
  visits: 1,
  lastVisit: '6/24',
  spend: '$165',
  primaryStaffId: '',
  primaryStaff: { initial: 'E', name: 'Emma', tone: 'sage' },
  memos: [
    { date: '6/24', staff: 'Emma', tone: 'sage', text: '初回来店。アッシュ系のカラーをご希望。ブリーチ未経験のため、次回はトーンダウンを提案。仕上がりにご満足いただけた様子。' },
    { date: '6/24', staff: 'Aoi', tone: 'accent', text: '受付・カウンセリングを担当。アレルギー・既往歴なしを確認。次回はヘッドスパもご検討中とのこと。' },
    { date: '6/22', staff: 'Mei', tone: 'rose', text: 'Instagram DMから予約のお問い合わせ。土曜午前を希望され、6/24 11:30で確定。' },
  ],
};

// ---- Inventory ----
export const stockItems: StockItem[] = [
  { id: 'i1', name: 'カラー剤 6N', categoryKey: 'catColor', stock: 3, capacity: 25, reorderPt: 10, status: 'order', supplier: 'ビューティガレージ' },
  { id: 'i2', name: 'アルミホイル', categoryKey: 'catSupply', stock: 1, capacity: 5, reorderPt: 2, status: 'order', supplier: 'Amazon ビジネス' },
  { id: 'i3', name: 'シャンプー（業務用）', categoryKey: 'catCare', stock: 8, capacity: 20, reorderPt: 10, status: 'low', supplier: 'ビューティガレージ' },
  { id: 'i4', name: 'ヘアオイル（店販）', categoryKey: 'catRetail', stock: 14, capacity: 20, reorderPt: 6, status: 'ok', supplier: 'メーカー直販' },
  { id: 'i5', name: 'トリートメント剤', categoryKey: 'catCare', stock: 22, capacity: 30, reorderPt: 12, status: 'ordered', supplier: 'ビューティガレージ' },
  { id: 'i6', name: 'フェイスタオル', categoryKey: 'catSupply', stock: 60, capacity: 80, reorderPt: 40, status: 'ok', supplier: 'Amazon ビジネス' },
  { id: 'i7', name: '使い捨てケープ', categoryKey: 'catSupply', stock: 30, capacity: 100, reorderPt: 50, status: 'low', supplier: '楽天市場' },
];

export const orderRows: OrderRow[] = [
  { id: 'o1', item: 'カラー剤 6N', qty: '20', supplier: 'B-Cosme', orderDate: '6/26', eta: '6/29', orderDateISO: '2026-06-26', etaISO: '2026-06-29', status: 'shipping' },
  { id: 'o2', item: 'アルミホイル', qty: '10箱', supplier: 'SalonPro', orderDate: '6/26', eta: '6/28', orderDateISO: '2026-06-26', etaISO: '2026-06-28', status: 'shipping' },
  { id: 'o3', item: 'ヘアオイル（店販）', qty: '12', supplier: 'Aroma Co.', orderDate: '6/27', eta: '7/1', orderDateISO: '2026-06-27', etaISO: '2026-07-01', status: 'ordered' },
  { id: 'o4', item: 'トリートメント剤', qty: '12', supplier: 'B-Cosme', orderDate: '6/24', eta: '6/27', orderDateISO: '2026-06-24', etaISO: '2026-06-27', status: 'arrived' },
  { id: 'o5', item: 'シャンプー（業務用）', qty: '24', supplier: 'SalonPro', orderDate: '6/20', eta: '6/23', orderDateISO: '2026-06-20', etaISO: '2026-06-23', status: 'arrived' },
];

// ---- Sales ----
export const salesSummary: SalesSummary = {
  monthRevenue: 18420,
  monthRevenueDelta: 12,
  avgSpend: 165,
  transactions: 112,
  serviceRevenue: 14180,
  retailRevenue: 4240,
};

// 6-month revenue trend (Jan..Jun). `month` is 1-based.
export const salesTrend: SalesMonthBar[] = [
  { month: 1, value: 13900 },
  { month: 2, value: 14600 },
  { month: 3, value: 15800 },
  { month: 4, value: 15200 },
  { month: 5, value: 16450 },
  { month: 6, value: 18420 },
];

export const salesCategories: SalesCategory[] = [
  { id: 'sc1', nameKey: 'svcColor', amount: 7360, pct: 40, tone: 'accent' },
  { id: 'sc2', nameKey: 'svcCut', amount: 4420, pct: 24, tone: 'sage' },
  { id: 'sc3', nameKey: 'svcSpa', amount: 2400, pct: 13, tone: 'rose' },
  { id: 'sc4', nameKey: 'salesRetail', amount: 4240, pct: 23, tone: 'accent' },
];

export const salesStaffRank: SalesStaffRank[] = [
  { id: 'sr1', initial: 'E', name: 'Emma', tone: 'sage', amount: 5240, share: 28 },
  { id: 'sr2', initial: 'Y', name: 'Yuki', tone: 'accent', amount: 4680, share: 25 },
  { id: 'sr3', initial: 'A', name: 'Aoi', tone: 'accent', amount: 3960, share: 22 },
  { id: 'sr4', initial: 'M', name: 'Mei', tone: 'rose', amount: 2740, share: 15 },
  { id: 'sr5', initial: 'L', name: 'Liam', tone: 'sage', amount: 1800, share: 10 },
];

export const salesTxns: SalesTxn[] = [
  { id: 't1', date: '6/27', customer: '山田 花子', serviceKey: 'svcCutColor', staffInitial: 'E', staffName: 'Emma', tone: 'sage', amount: 245 },
  { id: 't2', date: '6/27', customer: '佐藤 美咲', serviceKey: 'svcSpa', staffInitial: 'A', staffName: 'Aoi', tone: 'accent', amount: 120 },
  { id: 't3', date: '6/27', customer: 'Olivia Chen', serviceKey: 'svcCut', staffInitial: 'E', staffName: 'Emma', tone: 'sage', amount: 85 },
  { id: 't4', date: '6/26', customer: '田中 葵', serviceKey: 'svcColor', staffInitial: 'M', staffName: 'Mei', tone: 'rose', amount: 165 },
  { id: 't5', date: '6/26', customer: 'Sophie Müller', serviceKey: 'svcSpa', staffInitial: 'A', staffName: 'Aoi', tone: 'accent', amount: 120 },
  { id: 't6', date: '6/26', customer: '渡辺 葵', serviceKey: 'svcCutColor', staffInitial: 'Y', staffName: 'Yuki', tone: 'accent', amount: 230 },
  { id: 't7', date: '6/25', customer: 'James Lee', serviceKey: 'svcCut', staffInitial: 'L', staffName: 'Liam', tone: 'sage', amount: 85 },
];

// ---- Access analytics (PRO, shown blurred behind the upsell) ----
export const accessStats = {
  webVisits: '1,240',
  webBars: [44, 62, 51, 78, 66, 88, 100],
  followers: '3,820',
  reach: '8.4k',
  igBars: [38, 55, 72, 60, 84, 76, 95],
};
