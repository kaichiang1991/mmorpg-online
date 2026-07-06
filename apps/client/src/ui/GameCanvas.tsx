import { useEffect, useRef } from 'react';
import { GameSession } from '../game/application/GameSession';

interface Props {
  token: string;
}

/** Thin React shell: mounts the game session and cleans it up. */
export function GameCanvas({ token }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const game = new GameSession();
    void game.mount(hostRef.current!, token);
    return () => game.destroy();
  }, [token]);

  return <div ref={hostRef} style={{ width: '100vw', height: '100vh', cursor: 'crosshair' }} />;
}
