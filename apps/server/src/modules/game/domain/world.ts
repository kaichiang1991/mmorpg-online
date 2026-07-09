import { GAME_CONSTANTS, PlayerSnapshot, WorldSnapshot } from '@mmo/shared';
import { CombatResolver } from './combat-resolver';
import { AttackResultVo } from './value-objects/attack-result.vo';
import { PositionVo } from './value-objects/position.vo';
import { Player } from './player';
import { SkillFactory } from './skill-factory';

export type AttackOutcome =
  | { kind: 'resolved'; attack: AttackResultVo }
  | { kind: 'castStarted'; skillId: string; duration: number; endsAt: number }
  | { kind: 'rejected' };

export type CastCancelReason = 'moved' | 'interrupted' | 'died' | 'disconnected';

export type WorldEvent =
  | {
      type: 'attackResolved';
      attackerId: string;
      targetId: string;
      skillId: string;
      attack: AttackResultVo;
    }
  | { type: 'castCancelled'; casterId: string; reason: CastCancelReason };

/**
 * Pure domain aggregate: the game world. Owns all players, advances the
 * simulation, produces snapshots. No sockets, no timers, no Nest — fully
 * unit-testable; the application layer drives it.
 */
export class World {
  private readonly players = new Map<string, Player>();
  private readonly combat = new CombatResolver();
  private readonly skills = new SkillFactory();

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
      // todo:
      { str: 200, int: 100, def: 100, mdef: 100, critRate: 0 },
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
    this.players.get(id)?.setTarget(new PositionVo(x, y).clampTo(this.width, this.height));
  }

  /**
   * Attack intent from a client. Instant skills resolve immediately
   * ('resolved'); skills with a cast time report 'castStarted' and settle
   * later in the tick. 'rejected' covers any failed validation (unknown
   * ids/skill, self, out of range, low mp, cooling down).
   */
  attack(attackerId: string, targetId: string, skillId: string, now: number): AttackOutcome {
    const attacker = this.players.get(attackerId);
    const target = this.players.get(targetId);
    if (!attacker || !target || attackerId === targetId) return { kind: 'rejected' };

    const skill = this.skills.get(skillId);
    if (!skill) return { kind: 'rejected' };

    const distance = attacker.position.distanceTo(target.position);
    if (distance > skill.range) return { kind: 'rejected' };

    if (attacker.mp.remaining < skill.mpCost) return { kind: 'rejected' };

    // todo: seperate try
    if (!attacker.tryAttack(now)) return { kind: 'rejected' };

    attacker.consumeMp(skill.mpCost);

    if (skill.castTime > 0)
      return {
        kind: 'castStarted',
        skillId,
        duration: skill.castTime,
        endsAt: now + skill.castTime,
      };

    const attack = this.combat.resolve(attacker.stats, target.stats, skill);
    target.injured(attack.finalDamage);
    return { kind: 'resolved', attack };
  }

  /** Advance the simulation by dt seconds. */
  tick(dt: number): WorldEvent[] {
    const events: WorldEvent[] = [];
    for (const player of this.players.values()) {
      player.advance(dt);
      // todo:
      // if (player.casting && now >= player.casting.endsAt) {
      // 重驗證：目標還在? 還活著? 距離?（詠唱期間世界變了）
      // 過 → resolve → events.push({ type: 'attackResolved', ... })
      // 不過 → events.push({ type: 'castCancelled', ... })
      // }
    }

    return events;
  }

  snapshot(now: number): WorldSnapshot {
    const players: PlayerSnapshot[] = [];
    for (const p of this.players.values()) {
      players.push({
        id: p.id,
        name: p.name,
        x: Math.round(p.x),
        y: Math.round(p.y),
        hp: p.hp.remaining,
        mp: p.mp.remaining,
      });
    }
    return { t: now, players };
  }
}
