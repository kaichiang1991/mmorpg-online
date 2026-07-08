/** 參戰者當下屬性：CombatResolver 的唯讀輸入 */
export interface Combatant {
  readonly str: number;
  readonly int: number;
  readonly def: number;
  readonly mdef: number;
  readonly critRate: number;
  // resistances、buffs... 之後擴充
}

/** 能參戰的單位：持有屬性快照。Player 已實作，之後的 Enemy 也實作這個 */
export interface CombatUnit {
  readonly stats: Combatant;
}

export const DEFAULT_COMBATANT: Combatant = {
  str: 100,
  int: 100,
  def: 100,
  mdef: 100,
  critRate: 0,
};
