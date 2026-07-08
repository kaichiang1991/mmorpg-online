import { DamageElement, DamageKind, Multiplier } from '../damage';

/** 一次攻擊的結算快照 */
export class AttackResultVo {
  constructor(
    public readonly finalDamage: number,
    public readonly kind: DamageKind,
    public readonly element: DamageElement,
    public readonly multipliers: readonly Multiplier[],
  ) {
    if (!Number.isInteger(finalDamage) || finalDamage < 1)
      throw new Error(`finalDamage must be a positive integer, got ${finalDamage}`);
  }

  get isCrit(): boolean {
    return this.multipliers.some((m) => m.source === 'crit');
  }

  get totalMultiplier(): number {
    return this.multipliers.reduce((acc, m) => acc * m.value, 1);
  }
}
