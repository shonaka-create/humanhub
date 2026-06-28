'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

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
  const displayName = String(formData.get('display_name') ?? '').trim();
  const initial = (displayName[0] ?? 'U').toUpperCase();
  const { data, error } = await supabase.auth.signUp({
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
    options: {
      // 表示名はユーザーメタデータに保存し、サイドバー/挨拶文に反映する。
      data: { display_name: displayName, initial },
    },
  });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(friendlyAuthError(error.message))}`);
  }
  // メール確認が無効なら signUp 時点でセッションが発行される → そのままアプリへ。
  if (data.session) {
    revalidatePath('/', 'layout');
    redirect('/');
  }
  // 確認が有効な場合は確認メール待ち。
  redirect('/login?message=signup');
}

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
