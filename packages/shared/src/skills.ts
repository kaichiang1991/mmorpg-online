import { SkillId } from './protocol';

/**
 * Static skill data needed by BOTH sides.
 * Server-only combat numbers (damage, element, mp cost, ...) stay in the
 * server domain and extend these entries.
 */
export interface SkillDefinition {
  readonly id: SkillId;
  /** Display name shown on the client. */
  readonly name: string;
  /** ms; 0 = instant cast. */
  readonly castTime: number;
  readonly cooldown?: number;
  readonly range: number;
}

export const SKILL_DEFINITIONS: Record<SkillId, SkillDefinition> = {
  basic: { id: 'basic', name: 'Attack', castTime: 0, range: 50 },
  spear: { id: 'spear', name: 'Spear', castTime: 0, range: 300 },
  fireball: { id: 'fireball', name: 'Fireball', castTime: 300, cooldown: 1000, range: 500 },
};
