import { headers } from 'next/headers';
import { SettingsView } from './SettingsView';
import { MembersPanel } from './MembersPanel';
import { getStaff } from '@/lib/data';
import { getMembers } from '@/lib/tenant';

export default async function SettingsPage() {
  const [staff, members, hdrs] = await Promise.all([getStaff(), getMembers(), headers()]);
  const host = hdrs.get('host') ?? '';
  const proto = hdrs.get('x-forwarded-proto') ?? 'http';
  const baseUrl = host ? `${proto}://${host}` : '';

  return (
    <>
      <SettingsView staff={staff} canManage={members.canManage} />
      <MembersPanel bundle={members} baseUrl={baseUrl} />
    </>
  );
}
