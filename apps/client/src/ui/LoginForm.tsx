import { FormEvent, useState } from 'react';
import type { AuthResponse } from '@mmo/shared';

interface Props {
  onSuccess: (auth: AuthResponse) => void;
}

async function postAuth(path: string, username: string, password: string): Promise<AuthResponse> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message ?? '請求失敗');
  return body as AuthResponse;
}

export function LoginForm({ onSuccess }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent, path: '/auth/login' | '/auth/register') => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      onSuccess(await postAuth(path, username, password));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={styles.wrap}>
      <form style={styles.box} onSubmit={(e) => void submit(e, '/auth/login')}>
        <h2 style={{ marginTop: 0 }}>MMORPG Online</h2>
        <input
          style={styles.input}
          placeholder="帳號（3-20 英數字）"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
        />
        <input
          style={styles.input}
          type="password"
          placeholder="密碼（至少 8 碼）"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={styles.button} type="submit" disabled={busy}>
            登入
          </button>
          <button
            style={{ ...styles.button, background: '#555' }}
            type="button"
            disabled={busy}
            onClick={(e) => void submit(e, '/auth/register')}
          >
            註冊
          </button>
        </div>
        {error && <p style={{ color: '#ff8080', marginBottom: 0 }}>{error}</p>}
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#eee',
  },
  box: {
    background: '#222',
    padding: '28px 32px',
    borderRadius: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    width: 280,
  },
  input: {
    fontSize: 15,
    padding: '9px 11px',
    borderRadius: 6,
    border: '1px solid #555',
    background: '#333',
    color: '#fff',
  },
  button: {
    flex: 1,
    fontSize: 15,
    padding: '9px 0',
    borderRadius: 6,
    border: 0,
    background: '#4a8cff',
    color: '#fff',
    cursor: 'pointer',
  },
};
