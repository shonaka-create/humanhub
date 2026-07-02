'use server';

// アカウント権限（memberships）と招待（invites）の管理アクション。
// いずれも通常のサーバークライアント経由のため、owner 以外は RLS で弾かれる。
// （memberships_insert/update/delete, invites_owner_all は is_tenant_owner を要求）

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getMembership } from '@/lib/tenant';

type Role = 'owner' | 'staff';

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? '').trim();
}

function normalizeRole(v: string): Role {
  return v === 'owner' ? 'owner' : 'staff';
}

/** アプリのベースURL（NEXT_PUBLIC_SITE_URL 優先、無ければリクエストヘッダから）。 */
async function baseUrl(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  const hdrs = await headers();
  const host = hdrs.get('host') ?? '';
  const proto = hdrs.get('x-forwarded-proto') ?? 'https';
  return host ? `${proto}://${host}` : '';
}

/**
 * 招待メールを自動送信する（Resend REST API）。任意機能。
 * 既定はオフ（＝「リンクをコピーして手動送付」運用）。
 * 有効化には INVITE_EMAIL_ENABLED=true かつ RESEND_API_KEY が必要
 * （独自ドメイン認証済みの INVITE_EMAIL_FROM 設定を推奨）。
 * 送信失敗は握りつぶす（招待自体は作成済みで、リンクコピーで共有できるため）。
 */
async function sendInviteEmail(to: string, link: string, roleLabel: string, salonName: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (process.env.INVITE_EMAIL_ENABLED !== 'true' || !apiKey) return;
  const from = process.env.INVITE_EMAIL_FROM || 'HUMAN-HUB <onboarding@resend.dev>';
  const html = `
    <div style="font-family:-apple-system,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;color:#2E2A25">
      <h2 style="font-weight:600">HUMAN-HUB への招待</h2>
      <p>${salonName} から、HUMAN-HUB（サロン管理システム）に <strong>${roleLabel}</strong> として招待されました。</p>
      <p>下のボタンから、<strong>このメールアドレス（${to}）</strong>で登録するとサロンに参加できます。</p>
      <p style="margin:24px 0">
        <a href="${link}" style="background:#A9836E;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600">
          招待を受けて登録する
        </a>
      </p>
      <p style="font-size:12px;color:#8A8178">ボタンが開けない場合は次のURLを開いてください:<br>${link}</p>
    </div>`;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject: `【HUMAN-HUB】${salonName}への招待`, html }),
    });
    if (!res.ok) {
      console.warn('invite email failed:', res.status, await res.text().catch(() => ''));
    }
  } catch (e) {
    console.warn('invite email error:', e);
  }
}

/** メンバーを招待する（invites に1行追加＋メール自動送信）。owner のみ。 */
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

  // 招待リンクをメールで自動送信（未設定・失敗時はリンク手動送付にフォールバック）。
  const link = `${await baseUrl()}/login?invite=${token}`;
  await sendInviteEmail(email, link, role === 'owner' ? 'オーナー' : 'スタッフ', me.tenantName);

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
