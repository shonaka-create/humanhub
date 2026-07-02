import { getCurrentStaff, getShiftWeek, getStaff, mondayYmd } from '@/lib/data';
import { ShiftsView } from './ShiftsView';

export default async function ShiftsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const sp = await searchParams;
  // ?week=YYYY-MM-DD（任意）で表示週を指定。未指定なら今週の月曜。
  const weekStart = mondayYmd(sp.week || undefined);

  const [week, staff, me] = await Promise.all([
    getShiftWeek(weekStart),
    getStaff(),
    getCurrentStaff(),
  ]);

  return <ShiftsView week={week} weekStart={weekStart} staff={staff} me={me} />;
}
