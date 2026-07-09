import { Combatant } from '../combatant';

/** 參戰屬性快照：不可變，建構即驗證 */
export class CombatStatsVo implements Combatant {
  constructor(
    readonly str: number,
    readonly int: number,
    readonly def: number,
    readonly mdef: number,
    readonly critRate: number,
  ) {
    for (const [name, value] of [
      ['str', str],
      ['int', int],
      ['def', def],
      ['mdef', mdef],
    ] as const) {
      if (!Number.isFinite(value) || value < 0)
        throw new Error(`${name} must be >= 0, got ${value}`);
    }
    if (!Number.isFinite(critRate) || critRate < 0 || critRate > 1)
      throw new Error(`critRate must be within [0, 1], got ${critRate}`);
  }

  static from(combatant: Combatant): CombatStatsVo {
    return new CombatStatsVo(
      combatant.str,
      combatant.int,
      combatant.def,
      combatant.mdef,
      combatant.critRate,
    );
  }
}
