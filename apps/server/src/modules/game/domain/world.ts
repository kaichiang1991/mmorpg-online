import { GAME_CONSTANTS, PlayerSnapshot, WorldSnapshot } from '@mmo/shared';
import { Player } from './player';

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

/**
 * Pure domain aggregate: the game world. Owns all players, advances the
 * simulation, produces snapshots. No sockets, no timers, no Nest — fully
 * unit-testable; the application layer drives it.
 */
export class World {
  private readonly players = new Map<string, Player>();

  constructor(
    readonly width: number = GAME_CONSTANTS.MAP_WIDTH,
    readonly height: number = GAME_CONSTANTS.MAP_HEIGHT,
  ) {}

  addPlayer(id: string, name: string): Player {
    const player = new Player(
      id,
      name,
      this.width / 2 + (Math.random() * 200 - 100),
      this.height / 2 + (Math.random() * 200 - 100),
      GAME_CONSTANTS.PLAYER_SPEED,
    );
    this.players.set(id, player);
    return player;
  }

  removePlayer(id: string): void {
    this.players.delete(id);
  }

  getPlayer(id: string): Player | undefined {
    return this.players.get(id);
  }

  get playerCount(): number {
    return this.players.size;
  }

  /** Move intent from a client. Target is clamped inside the map. */
  setMoveTarget(id: string, x: number, y: number): void {
    this.players
      .get(id)
      ?.setTarget(clamp(x, 0, this.width), clamp(y, 0, this.height));
  }

  /** Advance the simulation by dt seconds. */
  tick(dt: number): void {
    for (const player of this.players.values()) {
      player.advance(dt);
    }
  }

  snapshot(now: number): WorldSnapshot {
    const players: PlayerSnapshot[] = [];
    for (const p of this.players.values()) {
      players.push({ id: p.id, name: p.name, x: Math.round(p.x), y: Math.round(p.y) });
    }
    return { t: now, players };
  }
}
