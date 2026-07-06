/**
 * Wire protocol shared by server and client.
 * Single source of truth: change here, both sides stay in sync.
 */

export const GAME_CONSTANTS = {
  MAP_WIDTH: 1600,
  MAP_HEIGHT: 1200,
  TICK_RATE: 20,
  SNAPSHOT_RATE: 10,
  PLAYER_SPEED: 220, // px per second
} as const;

/* ------------------------------------------------------------- REST auth */

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  username: string;
}

/* --------------------------------------------------------- socket events */

export interface PlayerSnapshot {
  id: string;
  name: string;
  x: number;
  y: number;
}

export interface WorldSnapshot {
  /** server timestamp (ms epoch) */
  t: number;
  players: PlayerSnapshot[];
}

export interface WelcomePayload {
  selfId: string;
  map: { width: number; height: number };
}

export interface MovePayload {
  x: number;
  y: number;
}

export interface AttackPayload {
  targetId: string;
}

export interface AttackEvent {
  attackerId: string;
  targetId: string;
  damage: number;
  /** server timestamp (ms epoch) */
  t: number;
}

/** events the client may emit */
export interface ClientToServerEvents {
  move: (payload: MovePayload) => void;
  attack: (payload: AttackPayload) => void;
}

/** events the server may emit */
export interface ServerToClientEvents {
  welcome: (payload: WelcomePayload) => void;
  snapshot: (payload: WorldSnapshot) => void;
  attack: (event: AttackEvent) => void;
}
