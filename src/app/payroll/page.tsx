import { getCurrentStaff, getMyPayslips, getPayRateRows, getPayrollRun } from '@/lib/data';
import { PayrollView } from './PayrollView';
import { StaffPayrollView } from './StaffPayrollView';

/** 'YYYY-MM'（当月）。 */
function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; month?: string }>;
}) {
  const me = await getCurrentStaff();

  // --- スタッフ: 自分の明細を読み取り専用で表示 ---
  if (me?.role !== 'owner') {
    const slips = me?.staffId ? await getMyPayslips(me.staffId) : [];
    return <StaffPayrollView slips={slips} linked={!!me?.staffId} />;
  }

  // --- オーナー: 給与テーブル管理＋月次計算 ---
  const sp = await searchParams;
  const tab = sp.tab === 'run' ? 'run' : 'rates';
  const month = /^\d{4}-\d{2}$/.test(sp.month ?? '') ? (sp.month as string) : currentMonth();

  const [rows, run] = await Promise.all([getPayRateRows(), getPayrollRun(month)]);
  return <PayrollView rows={rows} isOwner tab={tab} month={month} run={run} />;
}
