import { GAME_CONSTANTS, PlayerSnapshot, SkillId, WorldSnapshot } from '@mmo/shared';
import { CombatResolver } from './combat-resolver';
import { AttackResultVo } from './value-objects/attack-result.vo';
import { PositionVo } from './value-objects/position.vo';
import { Player } from './player';
import { SkillFactory } from './skill-factory';

export type AttackOutcome =
  | { kind: 'resolved'; skillId: SkillId; attack: AttackResultVo }
  | { kind: 'castStarted'; skillId: SkillId; duration: number; endsAt: number }
  | { kind: 'rejected' };

export type CastCancelReason = 'moved' | 'interrupted' | 'died' | 'disconnected';

export type WorldEvent =
  | {
      type: 'attackResolved';
      attackerId: string;
      targetId: string;
      skillId: SkillId;
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
  private readonly castTargets = new Map<string, string>();

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

  /** Per-player computed mp costs for every known skill; empty for unknown players. */
  skillMpCosts(playerId: string): Record<SkillId, number> {
    const costs = {} as Record<SkillId, number>;
    const player = this.players.get(playerId);
    if (!player) return costs;

    for (const skill of this.skills.all()) {
      costs[skill.id] = player.mpCostOf(skill);
    }
    return costs;
  }

  get playerCount(): number {
    return this.players.size;
  }

  /**
   * Move intent from a client. Target is clamped inside the map.
   * Moving cancels any cast in progress — the caller broadcasts the event.
   */
  setMoveTarget(id: string, x: number, y: number): WorldEvent | null {
    const player = this.players.get(id);
    if (!player) return null;

    player.setTarget(new PositionVo(x, y).clampTo(this.width, this.height));
    if (!player.casting) return null;

    player.clearCasting();
    this.castTargets.delete(id);
    return { type: 'castCancelled', casterId: id, reason: 'moved' };
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

    const mpCost = attacker.mpCostOf(skill);
    if (attacker.mp.remaining < mpCost) return { kind: 'rejected' };

    if (!attacker.tryUseSkill(skill, now)) return { kind: 'rejected' };

    attacker.consumeMp(mpCost);

    if (skill.castTime > 0) {
      attacker.castSkill(skill, now);
      this.castTargets.set(attackerId, targetId);
      return {
        kind: 'castStarted',
        skillId: skill.id,
        duration: skill.castTime,
        endsAt: now + skill.castTime,
      };
    }

    const attack = this.combat.resolve(attacker.stats, target.stats, skill);
    target.injured(attack.finalDamage);
    return { kind: 'resolved', skillId: skill.id, attack };
  }

  /** Advance the simulation by dt seconds. */
  tick(dt: number, now: number): WorldEvent[] {
    const events: WorldEvent[] = [];
    for (const [attackerId, attacker] of this.players) {
      attacker.advance(dt);

      const casting = attacker.casting;
      if (!casting || !casting.isDone(now)) continue;

      const targetId = this.castTargets.get(attackerId);
      const target = targetId ? this.players.get(targetId) : undefined;
      const skill = casting.skill;

      attacker.clearCasting();
      this.castTargets.delete(attackerId);

      if (!target || attacker.position.distanceTo(target.position) > skill.range) {
        events.push({ type: 'castCancelled', casterId: attackerId, reason: 'interrupted' });
        continue;
      }

      const attack = this.combat.resolve(attacker.stats, target.stats, skill);
      target.injured(attack.finalDamage);
      events.push({
        type: 'attackResolved',
        attackerId,
        targetId: target.id,
        skillId: skill.id,
        attack,
      });
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
