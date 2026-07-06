import { DamageElement, DamageKind, Skill } from './attack';

/** 目前唯一的攻擊手段；之後技能系統從這裡長出去 */
export const BASIC_ATTACK: Skill = {
  id: 'basic',
  baseDamage: 10,
  multiplier: 1,
  kind: DamageKind.Physical,
  element: DamageElement.None,
};
