import { SKILL_DEFINITIONS, SkillDefinition } from '@mmo/shared';
import { DamageElement, DamageKind } from './damage';

/** 技能的靜態定義：共用欄位來自 @mmo/shared，這裡補上純戰鬥數值 */
export interface Skill extends SkillDefinition {
  readonly baseDamage: number;
  readonly multiplier: number; // 技能本身的倍率
  readonly kind: DamageKind;
  readonly element: DamageElement;
  readonly mpCost: number;
  readonly hitCount?: number; // 多段攻擊/連擊的段數，預設視為 1
}

export const BASIC_ATTACK: Skill = {
  ...SKILL_DEFINITIONS.basic,
  baseDamage: 10,
  multiplier: 1,
  kind: DamageKind.Physical,
  element: DamageElement.None,
  mpCost: 0,
};

export const SPEAR: Skill = {
  ...SKILL_DEFINITIONS.spear,
  baseDamage: 25,
  multiplier: 1.2,
  kind: DamageKind.Physical,
  element: DamageElement.None,
  mpCost: 10,
};

export const FIRE_BALL: Skill = {
  ...SKILL_DEFINITIONS.fireball,
  baseDamage: 80,
  multiplier: 1.5,
  kind: DamageKind.Magical,
  element: DamageElement.Fire,
  mpCost: 20,
};
