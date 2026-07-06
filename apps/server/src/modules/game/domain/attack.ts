export enum DamageKind {
  Physical = 'physical',
  Magical = 'magical',
}

export enum DamageElement {
  None = 'none',
  Fire = 'fire',
  Ice = 'ice',
  Thunder = 'thunder',
}

/** 倍率的單一來源，供追溯與戰報顯示 */
export interface Multiplier {
  readonly source: string; // 'skill' | 'crit' | 'buff' | 'element' ...
  readonly value: number; // 1.5 = +50%
}

/** 技能的靜態定義 */
export interface Skill {
  readonly id: string;
  readonly baseDamage: number;
  readonly multiplier: number; // 技能本身的倍率
  readonly kind: DamageKind;
  readonly element: DamageElement;
  readonly hitCount?: number; // 多段攻擊/連擊的段數，預設視為 1
}

/** 參戰者當下屬性（Player、怪物皆實作） */
export interface Combatant {
  str: number;
  int: number;
  def: number;
  mdef: number;
  critRate: number;
  // resistances、buffs... 之後擴充
}
export const DEFAULT_COMBATANT: Combatant = {
  str: 100,
  int: 100,
  def: 100,
  mdef: 100,
  critRate: 0,
};

/** 一次攻擊的結算快照 */
export class Attack {
  constructor(
    public readonly finalDamage: number,
    public readonly kind: DamageKind,
    public readonly element: DamageElement,
    public readonly multipliers: readonly Multiplier[],
  ) {}
}
