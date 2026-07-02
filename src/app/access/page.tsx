import { getProAccess } from '@/lib/data';
import { AccessView } from './AccessView';

export default async function AccessPage() {
  const pro = await getProAccess();
  return <AccessView pro={pro} />;
}
