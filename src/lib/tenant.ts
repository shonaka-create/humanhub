import 'server-only';

// テナント／メンバーシップのサーバー側ヘルパー。
// - getMembership(): ログイン中ユーザーの所属テナントとロールを返す。
// - ensureMembership(): 初回ログイン時にテナント＋membership を用意する（招待受諾 or 新規オーナー）。
// - requireOwner(): owner 以外を弾く。
// bootstrap（テナント作成・招待受諾）は RLS をバイパスする admin クライアントで行う。

import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export type Role = 'owner' | 'staff';

export type Membership = {
  tenantId: string;
  tenantName: string;
  role: Role;
  displayName: string;
  email: string;
};

type PendingMeta = {
  display_name?: string;
  pending_salon_name?: string;
  pending_invite_token?: string;
};

/** ログイン中ユーザーの membership を返す（無ければ ensure で作成を試みる）。 */
export async function getMembership(): Promise<Membership | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const existing = await readMembership(user.id);
  if (existing) return existing;

  // まだ紐づいていない（新規オーナー登録／招待受諾の初回）→ 用意する。
  return ensureMembership(user);
}

/** owner を必須にする。owner でなければ例外。呼び出し側で 403/リダイレクト処理する。 */
export async function requireOwner(): Promise<Membership> {
  const m = await getMembership();
  if (!m || m.role !== 'owner') {
    throw new Error('FORBIDDEN: owner role required');
  }
  return m;
}

export type MemberRow = {
  userId: string;
  displayName: string;
  email: string;
  role: Role;
  isSelf: boolean;
};

export type PendingInvite = {
  id: string;
  email: string;
  role: Role;
  token: string;
  createdAt: string;
};

export type MembersBundle = {
  canManage: boolean; // 現在のユーザーが owner か
  members: MemberRow[];
  invites: PendingInvite[]; // owner のみ取得できる（RLS）
};

/**
 * 設定画面の「アカウント・権限」一覧用データ。
 * members は同テナント全員（RLS で自テナントに限定）、invites は owner のみ取得できる。
 */
export async function getMembers(): Promise<MembersBundle> {
  const empty: MembersBundle = { canManage: false, members: [], invites: [] };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return empty;
  const me = await getMembership();
  if (!me) return empty;

  const [{ data: mem }, { data: inv }] = await Promise.all([
    supabase
      .from('memberships')
      .select('user_id, display_name, email, role')
      .eq('tenant_id', me.tenantId)
      .order('created_at', { ascending: true }),
    // owner でなければ RLS により空配列が返る。
    supabase
      .from('invites')
      .select('id, email, role, token, created_at')
      .eq('tenant_id', me.tenantId)
      .is('accepted_at', null)
      .order('created_at', { ascending: true }),
  ]);

  return {
    canManage: me.role === 'owner',
    members: (mem ?? []).map((r) => ({
      userId: r.user_id,
      displayName: r.display_name ?? '',
      email: r.email ?? '',
      role: r.role as Role,
      isSelf: r.user_id === user.id,
    })),
    invites: (inv ?? []).map((r) => ({
      id: r.id,
      email: r.email,
      role: r.role as Role,
      token: r.token,
      createdAt: r.created_at,
    })),
  };
}

/** admin クライアントで直接 membership を1件読む（RLS 非依存）。 */
async function readMembership(userId: string): Promise<Membership | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('memberships')
    .select('tenant_id, role, display_name, email, tenants(name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return {
    tenantId: data.tenant_id,
    tenantName: tenantNameOf(data),
    role: data.role as Role,
    displayName: data.display_name ?? '',
    email: data.email ?? '',
  };
}

/** Supabase の埋め込み結合（tenants）は環境によりオブジェクト／配列で返るため両対応で名前を取り出す。 */
function tenantNameOf(row: { tenants?: unknown }): string {
  const rel = row.tenants as { name?: string } | { name?: string }[] | null | undefined;
  if (Array.isArray(rel)) return rel[0]?.name ?? '';
  return rel?.name ?? '';
}

/**
 * membership が無ければ作成する。
 *   - 有効な招待トークンがあれば、そのテナントに招待どおりのロールで参加。
 *   - それ以外は新規テナントを作り、本人を owner にする。
 * 冪等: 既に membership があればそれを返すだけ。
 */
export async function ensureMembership(user: User): Promise<Membership | null> {
  const existing = await readMembership(user.id);
  if (existing) return existing;

  const admin = createAdminClient();
  const meta = (user.user_metadata ?? {}) as PendingMeta;
  const email = user.email ?? '';
  const displayName = (meta.display_name || email.split('@')[0] || 'User').trim();

  // --- 招待トークン経由の参加 ---
  const token = meta.pending_invite_token?.trim();
  if (token) {
    const { data: invite } = await admin
      .from('invites')
      .select('id, tenant_id, role, email, accepted_at, tenants(name)')
      .eq('token', token)
      .maybeSingle();
    if (
      invite &&
      !invite.accepted_at &&
      (!invite.email || invite.email.toLowerCase() === email.toLowerCase())
    ) {
      const { data: created, error } = await admin
        .from('memberships')
        .insert({
          tenant_id: invite.tenant_id,
          user_id: user.id,
          role: invite.role,
          display_name: displayName,
          email,
        })
        .select('tenant_id, role, display_name, email')
        .single();
      if (!error && created) {
        await admin.from('invites').update({ accepted_at: new Date().toISOString() }).eq('id', invite.id);
        return {
          tenantId: created.tenant_id,
          tenantName: tenantNameOf(invite),
          role: created.role as Role,
          displayName: created.display_name ?? '',
          email: created.email ?? '',
        };
      }
    }
    // 招待が無効／期限切れ／使用済みの場合は、下の新規オーナー作成にフォールバックする。
  }

  // --- 新規テナントのオーナーとして作成 ---
  const salonName = (meta.pending_salon_name || `${displayName}のサロン`).trim();
  const { data: tenant, error: tErr } = await admin
    .from('tenants')
    .insert({ name: salonName })
    .select('id, name')
    .single();
  if (tErr || !tenant) return null;

  const { data: created, error: mErr } = await admin
    .from('memberships')
    .insert({
      tenant_id: tenant.id,
      user_id: user.id,
      role: 'owner',
      display_name: displayName,
      email,
    })
    .select('tenant_id, role, display_name, email')
    .single();
  if (mErr || !created) return null;

  return {
    tenantId: created.tenant_id,
    tenantName: tenant.name ?? salonName,
    role: created.role as Role,
    displayName: created.display_name ?? '',
    email: created.email ?? '',
  };
}
