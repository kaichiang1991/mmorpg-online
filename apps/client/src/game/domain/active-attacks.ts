import { AttackEvent } from '@mmo/shared';

/**
 * A client-side fact: "this attack is happening right now."
 * Data only — how it looks (trajectory, colors, fade) lives in the renderer.
 *
 * ActiveAttackTracker (push/activeAt, same pattern as Interpolator) will be
 * added here once the `attack` event lands in the shared protocol.
 */
export interface ActiveAttack {
  attackerId: string;
  targetId: string;
  damage: number;
  /** local clock (same as interpolator's receivedAt / performance.now()) */
  startedAt: number;
}

export class ActiveAttackTracker{

  private attacks: ActiveAttack[] = [];

  constructor(private readonly ttlMs: number) {
  }

  push(event: AttackEvent, receivedAt: number): void {
    this.attacks.push({
      attackerId: event.attackerId,
      targetId: event.targetId,
      damage: event.damage,
      startedAt: receivedAt,
    });
  }

  activeAt(now: number): ActiveAttack[] {
    this.attacks = this.attacks.filter((attack) => now - attack.startedAt < this.ttlMs);
    return this.attacks;
  }
}