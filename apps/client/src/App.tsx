import { useState } from 'react';
import type { AuthResponse } from '@mmo/shared';
import { GameCanvas } from './ui/GameCanvas';
import { LoginForm } from './ui/LoginForm';

const STORAGE_KEY = 'mmo.auth';

function isExpired(token: string): boolean {
  try {
    const { exp } = JSON.parse(atob(token.split('.')[1])) as { exp?: number };
    return typeof exp !== 'number' || exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

function loadAuth(): AuthResponse | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const auth = JSON.parse(raw) as AuthResponse;
    if (isExpired(auth.token)) throw new Error('expired');
    return auth;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function App() {
  const [auth, setAuth] = useState<AuthResponse | null>(loadAuth);

  const handleAuth = (next: AuthResponse) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setAuth(next);
  };

  return auth ? <GameCanvas token={auth.token} /> : <LoginForm onSuccess={handleAuth} />;
}
