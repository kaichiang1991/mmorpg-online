import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@mmo/shared';

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/** Connects through the Vite dev proxy (same origin), JWT in the handshake. */
export function connect(token: string): GameSocket {
  return io({ auth: { token } });
}
