import LoginForm from './LoginForm';
import FlashMessage from './FlashMessage';
import CheckEmail from './CheckEmail';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; email?: string }>;
}) {
  const { error, message, email } = await searchParams;
  const showCheckEmail = message === 'signup';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--paper)',
        color: 'var(--ink)',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          background: 'var(--card)',
          border: '1px solid var(--line)',
          borderRadius: 16,
          padding: '40px 32px',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--serif)',
            fontSize: 26,
            fontWeight: 600,
            margin: '0 0 4px',
            textAlign: 'center',
          }}
        >
          HUMAN-HUB
        </h1>
        <p
          style={{
            fontSize: 13,
            color: 'var(--ink2)',
            textAlign: 'center',
            margin: '0 0 28px',
          }}
        >
          サロン管理システム ログイン
        </p>

        {showCheckEmail ? (
          <CheckEmail email={email} />
        ) : (
          <>
            <FlashMessage error={error} message={message} />
            <LoginForm />
          </>
        )}
      </div>
    </div>
  );
}
