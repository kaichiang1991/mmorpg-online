import { SkillId } from '@mmo/shared';
import { DamageElement, DamageKind } from './damage';

/** 技能的靜態定義 */
export interface Skill {
  readonly id: SkillId;
  readonly baseDamage: number;
  readonly multiplier: number; // 技能本身的倍率
  readonly range: number;
  readonly kind: DamageKind;
  readonly element: DamageElement;
  readonly mpCost: number;
  readonly castTime: number; // ms；未設或 0 = 瞬發（普攻、瞬發技能）
  readonly hitCount?: number; // 多段攻擊/連擊的段數，預設視為 1
}

export const BASIC_ATTACK: Skill = {
  id: 'basic',
  baseDamage: 10,
  multiplier: 1,
  range: 50,
  kind: DamageKind.Physical,
  element: DamageElement.None,
  mpCost: 0,
  castTime: 0,
};

export const SPEAR: Skill = {
  id: 'spear',
  baseDamage: 25,
  multiplier: 1.2,
  range: 300,
  kind: DamageKind.Physical,
  element: DamageElement.None,
  mpCost: 10,
  castTime: 0,
};

export const FIRE_BALL: Skill = {
  id: 'fireball',
  baseDamage: 80,
  multiplier: 1.5,
  range: 500,
  kind: DamageKind.Magical,
  element: DamageElement.Fire,
  mpCost: 20,
  castTime: 300,
};
