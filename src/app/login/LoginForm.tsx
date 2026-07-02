'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { login, signup } from './actions';

/** 送信中は「処理中…」表示＋無効化して、押下の反応をすぐ返す。 */
function SubmitButton({ action, label }: { action: (formData: FormData) => void; label: string }) {
  const { pending, action: pendingAction } = useFormStatus();
  const isThis = pending && pendingAction === action;
  return (
    <button
      formAction={action}
      disabled={pending}
      style={{ ...primaryBtn, opacity: pending ? 0.7 : 1, cursor: pending ? 'default' : 'pointer' }}
    >
      {isThis ? '処理中…' : label}
    </button>
  );
}

export default function LoginForm({ inviteToken }: { inviteToken?: string }) {
  // 招待リンク（?invite=...）で来た場合は最初から新規登録モードにする。
  const invited = Boolean(inviteToken);
  const [mode, setMode] = useState<'login' | 'signup'>(invited ? 'signup' : 'login');
  const isSignup = mode === 'signup';

  return (
    <form style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>
          {isSignup ? '新規登録' : 'ログイン'}
        </h2>
        <p style={{ fontSize: 12.5, color: 'var(--ink2)', margin: 0 }}>
          {isSignup
            ? '登録後、確認メールのリンクを開くとログインできます'
            : 'アカウントにログインしてください'}
        </p>
      </div>

      {isSignup && (
        <>
          <label style={fieldStyle}>
            <span style={labelStyle}>システム表示名</span>
            <input
              name="display_name"
              type="text"
              required
              autoComplete="name"
              placeholder="例）田中 由樹"
              style={inputStyle}
            />
          </label>

          <label style={fieldStyle}>
            <span style={labelStyle}>組織名・会社名（新規に立ち上げる方のみ）</span>
            <input
              name="salon_name"
              type="text"
              placeholder="例）HUMAN-HUB 表参道店"
              style={inputStyle}
            />
            <span style={hintStyle}>
              スタッフとして参加する方は空欄のまま、下の「招待コード」を入力してください。
            </span>
          </label>

          <label style={fieldStyle}>
            <span style={labelStyle}>招待コード（スタッフの方のみ）</span>
            <input
              name="invite_token"
              type="text"
              defaultValue={inviteToken ?? ''}
              placeholder="オーナーから受け取ったコード"
              style={inputStyle}
            />
          </label>
        </>
      )}

      <label style={fieldStyle}>
        <span style={labelStyle}>メールアドレス</span>
        <input name="email" type="email" required autoComplete="email" style={inputStyle} />
      </label>

      <label style={fieldStyle}>
        <span style={labelStyle}>{isSignup ? 'パスワード（6文字以上）' : 'パスワード'}</span>
        <input
          name="password"
          type="password"
          required
          minLength={isSignup ? 6 : undefined}
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          style={inputStyle}
        />
      </label>

      {isSignup ? (
        <SubmitButton action={signup} label="登録して確認メールを送る" />
      ) : (
        <SubmitButton action={login} label="ログイン" />
      )}

      <p style={{ fontSize: 12.5, color: 'var(--ink2)', textAlign: 'center', margin: '6px 0 0' }}>
        {isSignup ? '既にアカウントをお持ちの方は ' : 'アカウントをお持ちでない方は '}
        <button
          type="button"
          onClick={() => setMode(isSignup ? 'login' : 'signup')}
          style={linkBtn}
        >
          {isSignup ? 'ログイン' : '新規登録'}
        </button>
      </p>
    </form>
  );
}

const fieldStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 };

const labelStyle: React.CSSProperties = { fontSize: 12.5, color: 'var(--ink2)' };

const hintStyle: React.CSSProperties = { fontSize: 11, color: 'var(--ink3)', lineHeight: 1.5 };

const inputStyle: React.CSSProperties = {
  border: '1px solid var(--line)',
  borderRadius: 8,
  padding: '10px 12px',
  font: '14px var(--ui)',
  color: 'var(--ink)',
  background: '#fff',
  outline: 'none',
};

const primaryBtn: React.CSSProperties = {
  marginTop: 8,
  border: 'none',
  borderRadius: 999,
  padding: '11px 16px',
  background: 'var(--accent)',
  color: '#fff',
  font: '14px var(--ui)',
  fontWeight: 600,
  cursor: 'pointer',
};

const linkBtn: React.CSSProperties = {
  border: 'none',
  background: 'none',
  padding: 0,
  color: 'var(--accent)',
  font: '600 12.5px var(--ui)',
  textDecoration: 'underline',
  cursor: 'pointer',
};
