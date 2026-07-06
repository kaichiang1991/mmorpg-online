import { GAME_CONSTANTS, PlayerSnapshot, WorldSnapshot } from '@mmo/shared';
import { Attack, Skill } from './attack';
import { CombatResolver } from './combat-resolver';
import { Player } from './player';
import { BASIC_ATTACK } from './skills';

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

/**
 * Pure domain aggregate: the game world. Owns all players, advances the
 * simulation, produces snapshots. No sockets, no timers, no Nest — fully
 * unit-testable; the application layer drives it.
 */
export class World {
  private readonly players = new Map<string, Player>();
  private readonly combat = new CombatResolver();

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
    this.players.get(id)?.setTarget(clamp(x, 0, this.width), clamp(y, 0, this.height));
  }

  /**
   * Attack intent from a client. Validates and resolves immediately;
   * null means rejected (unknown ids, self, out of range, cooling down).
   */
  attack(attackerId: string, targetId: string, skillId: string, now: number): Attack | null {
    const attacker = this.players.get(attackerId);
    const target = this.players.get(targetId);
    if (!attacker || !target || !skillId || attackerId === targetId) return null;

    const distance = Math.hypot(target.x - attacker.x, target.y - attacker.y);
    if (distance > GAME_CONSTANTS.ATTACK_RANGE) return null;
    if (!attacker.tryAttack(now)) return null;

    // todo: use factory to get skill by id
    const useSkill: Skill = BASIC_ATTACK;
    const attack = this.combat.resolve(attacker, target, useSkill);
    target.injured(attack.finalDamage);
    return attack;
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
      players.push({
        id: p.id,
        name: p.name,
        x: Math.round(p.x),
        y: Math.round(p.y),
        hp: p.hp.remainHp,
        mp: 200,
      });
    }
    return { t: now, players };
  }
}
