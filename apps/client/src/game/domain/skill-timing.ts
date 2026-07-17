import type { SkillId } from '@mmo/shared';
import type { ActiveAttack } from './active-attacks';

/**
 * How long an attack counts as "happening" on the client (the attacker's
 * swing/cast phase), in local-clock ms. Domain fact — the renderer derives
 * its visual phase timing from this, not the other way around.
 */
export const ATTACK_TTL_MS = 400;

/**
 * When the hit lands, in ms after the attack starts. Skills without an
 * entry hit instantly. EffectLayer keeps its impact visuals (damage number,
 * landing) in the same proportion so what you see matches the flinch.
 */
const IMPACT_AT_MS: Partial<Record<SkillId, number>> = {
  fireball: ATTACK_TTL_MS * 0.9, // falls for 90% of the effect, lands at the end
};

export const impactAtMs = (skillId: SkillId): number => IMPACT_AT_MS[skillId] ?? 0;

/** How long the target flinches once the hit lands. */
export const HURT_DURATION_MS = 300;

/**
 * How long an attack must stay queryable: the attacker's swing and the
 * target's flinch both render from it, whichever window closes last.
 */
export const attackRetentionMs = (skillId: SkillId): number =>
  Math.max(ATTACK_TTL_MS, impactAtMs(skillId) + HURT_DURATION_MS);

/** Is the attacker mid-swing/cast at `now`? */
export const isAttackingAt = (attack: ActiveAttack, now: number): boolean =>
  now - attack.startedAt < ATTACK_TTL_MS;

/** Is the target flinching at `now`? Opens at impact, not at the attack event. */
export const isHurtingAt = (attack: ActiveAttack, now: number): boolean => {
  const sinceImpact = now - attack.startedAt - impactAtMs(attack.skillId);
  return sinceImpact >= 0 && sinceImpact < HURT_DURATION_MS;
};
