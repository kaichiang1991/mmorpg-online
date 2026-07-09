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
  ATTACK_RANGE: 200, // px, center to center
  ATTACK_COOLDOWN_MS: 600,
  MAX_HP: 1000, // TODO: per-player stat once hp lives on the server entity
  MAX_MP: 200, // TODO: same as MAX_HP
} as const;

/** Canonical skill ids — server domain and client display both key off these. */
export const SKILL_IDS = ['basic', 'spear'] as const;
export type SkillId = (typeof SKILL_IDS)[number];
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
  hp: number;
  mp: number;
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
  skillId: string;
}

/** Mirrors combat-design.md's DamageKind — wire-format copy, string union keeps it dependency-free from server domain code. */
export type DamageKind = 'physical' | 'magical';

/** Mirrors combat-design.md's DamageElement. */
export type DamageElement = 'none' | 'fire' | 'ice' | 'thunder';

/** Mirrors combat-design.md's Multiplier — one line of the damage breakdown, for battle-log/floating-text detail. */
export interface Multiplier {
  source: string;
  value: number;
}

export interface AttackResultPayload {
  attackerId: string;
  targetId: string;
  skillId: string;
  damage: number;
  /** Derived from the crit multiplier; stays false until CombatResolver rolls crit. */
  crit: boolean;
  kind: DamageKind;
  element: DamageElement;
  multipliers: Multiplier[];
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
  attack: (event: AttackResultPayload) => void;
}
