import { useState } from 'react';
import type { AuthResponse } from '@mmo/shared';
import { GameCanvas } from './ui/GameCanvas';
import { LoginForm } from './ui/LoginForm';

export function App() {
  const [auth, setAuth] = useState<AuthResponse | null>(null);

  return auth ? <GameCanvas token={auth.token} /> : <LoginForm onSuccess={setAuth} />;
}
