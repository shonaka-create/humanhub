'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ensureMembership, normalizeInviteToken } from '@/lib/tenant';

export async function login(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
  });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(friendlyAuthError(error.message))}`);
  }
  revalidatePath('/', 'layout');
  redirect('/');
}

/** Supabase の英語エラーを、よくあるケースだけ日本語に置き換える。 */
function friendlyAuthError(message: string): string {
  if (/after \d+ seconds/i.test(message)) {
    return 'セキュリティのため、しばらく待ってから再度お試しください（短時間の連続操作が制限されています）。';
  }
  if (/already registered|already exists/i.test(message)) {
    return 'このメールアドレスは既に登録されています。「ログインに戻る」からログインしてください。';
  }
  if (/invalid login credentials/i.test(message)) {
    return 'メールアドレスまたはパスワードが正しくありません。';
  }
  if (/password should be at least/i.test(message)) {
    return 'パスワードは6文字以上で入力してください。';
  }
  return message;
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get('email') ?? '');
  const displayName = String(formData.get('display_name') ?? '').trim();
  const initial = (displayName[0] ?? 'U').toUpperCase();
  const salonName = String(formData.get('salon_name') ?? '').trim();
  // リンク全体や ?invite=... を貼られてもトークンだけを取り出して保存する。
  const inviteToken = normalizeInviteToken(String(formData.get('invite_token') ?? ''));
  const { data, error } = await supabase.auth.signUp({
    email,
    password: String(formData.get('password') ?? ''),
    options: {
      // 表示名・登録意図（新規サロン名／招待トークン）をメタデータに退避する。
      // ロール自体はここに置かない（本人が書き換え可能なため）。実際の権限は
      // membership 作成時に、招待トークンを invites テーブルで検証して決まる。
      data: {
        display_name: displayName,
        initial,
        pending_salon_name: salonName || null,
        pending_invite_token: inviteToken || null,
      },
    },
  });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(friendlyAuthError(error.message))}`);
  }
  // メール確認が無効なら signUp 時点でセッションが発行される → membership を用意してアプリへ。
  if (data.session && data.user) {
    await ensureMembership(data.user);
    revalidatePath('/', 'layout');
    redirect('/');
  }
  // 確認が有効な場合は確認メール待ち → 確認案内画面へ。
  // membership は初回ログイン時（getCurrentUser）に用意される。
  redirect(`/login?message=signup&email=${encodeURIComponent(email)}`);
}

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
