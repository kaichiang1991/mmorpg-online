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
