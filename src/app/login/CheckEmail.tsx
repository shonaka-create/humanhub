'use client';

import { useEffect } from 'react';

/**
 * 新規登録後の「確認メールを送信しました」画面。
 * URL のパラメータは表示後に除去し、リロードで戻れるようにする。
 */
export default function CheckEmail({ email }: { email?: string }) {
  useEffect(() => {
    window.history.replaceState({}, '', '/login');
  }, []);

  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'var(--sage-soft, #e9efe9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 18px',
        }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--sage)" strokeWidth="1.7">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 7l9 6 9-6" strokeLinecap="round" />
        </svg>
      </div>

      <h2 style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 600, margin: '0 0 10px' }}>
        確認メールを送信しました
      </h2>

      <p style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.7, margin: '0 0 6px' }}>
        {email ? (
          <>
            <strong style={{ color: 'var(--ink)' }}>{email}</strong> 宛に確認メールをお送りしました。
          </>
        ) : (
          '確認メールをお送りしました。'
        )}
        <br />
        メール内のリンクをクリックすると登録が完了し、ログインできます。
      </p>
      <p style={{ fontSize: 12, color: 'var(--ink3)', lineHeight: 1.6, margin: '0 0 22px' }}>
        メールが届かない場合は、迷惑メールフォルダもご確認ください。
      </p>

      <a
        href="/login"
        style={{
          display: 'inline-block',
          border: '1px solid var(--line)',
          borderRadius: 999,
          padding: '10px 22px',
          background: '#fff',
          color: 'var(--ink2)',
          font: '13px var(--ui)',
          textDecoration: 'none',
        }}
      >
        ログイン画面に戻る
      </a>
    </div>
  );
}
