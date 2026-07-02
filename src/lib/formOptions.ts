import type { LabelKey, ShiftStatus, Tone } from './types';

/** 施術メニュー（services テーブルのキー＝i18n キー）。 */
export const SERVICE_KEYS: LabelKey[] = ['svcCut', 'svcColor', 'svcCutColor', 'svcSpa'];

/** 在庫カテゴリ（i18n キー）。 */
export const CATEGORY_KEYS: LabelKey[] = ['catColor', 'catCare', 'catSupply', 'catRetail'];

/** 配色トーンとそのラベルキー。 */
export const TONE_OPTIONS: { value: Tone; labelKey: LabelKey }[] = [
  { value: 'accent', labelKey: 'toneAccent' },
  { value: 'sage', labelKey: 'toneSage' },
  { value: 'rose', labelKey: 'toneRose' },
];

/** シフト実績の状態とラベルキー。 */
export const SHIFT_STATUS_OPTIONS: { value: ShiftStatus; labelKey: LabelKey }[] = [
  { value: 'worked', labelKey: 'shiftStWorked' },
  { value: 'off', labelKey: 'shiftStOff' },
  { value: 'paid_leave', labelKey: 'shiftStLeave' },
];

/** 曜日（shifts.weekday: 0=月..6=日）とラベルキー。 */
export const WEEKDAY_OPTIONS: { value: number; labelKey: LabelKey }[] = [
  { value: 0, labelKey: 'mon' },
  { value: 1, labelKey: 'tue' },
  { value: 2, labelKey: 'wed' },
  { value: 3, labelKey: 'thu' },
  { value: 4, labelKey: 'fri' },
  { value: 5, labelKey: 'sat' },
  { value: 6, labelKey: 'sun' },
];
