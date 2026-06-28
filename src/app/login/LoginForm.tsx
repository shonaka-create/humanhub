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

export default function LoginForm() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const isSignup = mode === 'signup';

  return (
    <form style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 12.5, color: 'var(--ink2)' }}>メールアドレス</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          style={inputStyle}
        />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 12.5, color: 'var(--ink2)' }}>パスワード</span>
        <input
          name="password"
          type="password"
          required
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          style={inputStyle}
        />
      </label>

      {isSignup && (
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12.5, color: 'var(--ink2)' }}>表示名（ユーザー名）</span>
          <input
            name="display_name"
            type="text"
            required
            autoComplete="name"
            placeholder="例）田中 由樹"
            style={inputStyle}
          />
        </label>
      )}

      {isSignup ? (
        <SubmitButton action={signup} label="新規アカウント作成" />
      ) : (
        <SubmitButton action={login} label="ログイン" />
      )}

      <button
        type="button"
        onClick={() => setMode(isSignup ? 'login' : 'signup')}
        style={secondaryBtn}
      >
        {isSignup ? 'ログインに戻る' : '新規アカウントを作成する'}
      </button>
    </form>
  );
}

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

const secondaryBtn: React.CSSProperties = {
  border: '1px solid var(--line)',
  borderRadius: 999,
  padding: '10px 16px',
  background: '#fff',
  color: 'var(--ink2)',
  font: '13px var(--ui)',
  cursor: 'pointer',
};
