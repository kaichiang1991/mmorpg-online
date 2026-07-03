import { useEffect, useRef } from 'react';
import { GameApp } from '../game/GameApp';

interface Props {
  token: string;
}

/** Thin React shell: mounts the Pixi GameApp and cleans it up. */
export function GameCanvas({ token }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const game = new GameApp();
    void game.mount(hostRef.current!, token);
    return () => game.destroy();
  }, [token]);

  return <div ref={hostRef} style={{ width: '100vw', height: '100vh', cursor: 'crosshair' }} />;
}
