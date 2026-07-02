'use server';

// アカウント権限（memberships）と招待（invites）の管理アクション。
// いずれも通常のサーバークライアント経由のため、owner 以外は RLS で弾かれる。
// （memberships_insert/update/delete, invites_owner_all は is_tenant_owner を要求）

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getMembership } from '@/lib/tenant';

type Role = 'owner' | 'staff';

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? '').trim();
}

function normalizeRole(v: string): Role {
  return v === 'owner' ? 'owner' : 'staff';
}

/** メンバーを招待する（invites に1行追加）。owner のみ。 */
export async function inviteMember(formData: FormData) {
  const email = str(formData, 'email').toLowerCase();
  if (!email) return;
  const role = normalizeRole(str(formData, 'role'));
  const me = await getMembership();
  if (!me || me.role !== 'owner') throw new Error('FORBIDDEN');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const token = randomUUID().replace(/-/g, '');
  const { error } = await supabase.from('invites').insert({
    tenant_id: me.tenantId,
    email,
    role,
    token,
    invited_by: user?.id ?? null,
  });
  if (error) throw error;
  revalidatePath('/settings');
}

/** 招待を取り消す。owner のみ。 */
export async function revokeInvite(formData: FormData) {
  const id = str(formData, 'id');
  if (!id) return;
  const supabase = await createClient();
  const { error } = await supabase.from('invites').delete().eq('id', id);
  if (error) throw error;
  revalidatePath('/settings');
}

/** メンバーのロールを変更する。owner のみ。自分自身は変更不可（ロックアウト防止）。 */
export async function updateMemberRole(formData: FormData) {
  const userId = str(formData, 'user_id');
  const role = normalizeRole(str(formData, 'role'));
  if (!userId) return;
  const me = await getMembership();
  if (!me || me.role !== 'owner') throw new Error('FORBIDDEN');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.id === userId) throw new Error('自分自身のロールは変更できません。');

  const { error } = await supabase
    .from('memberships')
    .update({ role })
    .eq('tenant_id', me.tenantId)
    .eq('user_id', userId);
  if (error) throw error;
  revalidatePath('/settings');
}

/** メンバーをテナントから外す。owner のみ。自分自身は外せない。 */
export async function removeMember(formData: FormData) {
  const userId = str(formData, 'user_id');
  if (!userId) return;
  const me = await getMembership();
  if (!me || me.role !== 'owner') throw new Error('FORBIDDEN');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.id === userId) throw new Error('自分自身は削除できません。');

  const { error } = await supabase
    .from('memberships')
    .delete()
    .eq('tenant_id', me.tenantId)
    .eq('user_id', userId);
  if (error) throw error;
  revalidatePath('/settings');
}
