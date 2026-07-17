import type { AttackResultPayload, SkillId } from '@mmo/shared';
import { attackRetentionMs } from './skill-timing';

export { ATTACK_TTL_MS } from './skill-timing';

/**
 * A client-side fact: "this attack is happening right now."
 * Data only — how it looks (trajectory, colors, fade) lives in the renderer.
 */
export interface ActiveAttack {
  attackerId: string;
  targetId: string;
  skillId: SkillId;
  damage: number;
  /** local clock (same as interpolator's receivedAt / performance.now()) */
  startedAt: number;
}

/**
 * Tracks attacks currently in flight. Same pattern as Interpolator:
 * `push()` ingests a server event, `activeAt(now)` answers for render time.
 * Pure logic — unit-tested, no Pixi/socket dependencies.
 */
export class ActiveAttackTracker {
  private attacks: ActiveAttack[] = [];

  /** `receivedAt` is the local clock — the payload carries no server timestamp to compare against. */
  push(event: AttackResultPayload, receivedAt: number): void {
    this.attacks.push({
      attackerId: event.attackerId,
      targetId: event.targetId,
      skillId: event.skillId,
      damage: event.damage,
      startedAt: receivedAt,
    });
  }

  /**
   * Attacks still alive at `now`; expired ones are dropped for good.
   * Retention outlives the swing when the skill hits late (skill-timing),
   * so the target's flinch can still be derived from the attack.
   */
  activeAt(now: number): ActiveAttack[] {
    this.attacks = this.attacks.filter(
      (attack) => now - attack.startedAt < attackRetentionMs(attack.skillId),
    );
    return this.attacks;
  }
}
