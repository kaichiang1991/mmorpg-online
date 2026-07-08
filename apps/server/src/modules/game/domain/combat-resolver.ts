import { Combatant } from './combatant';
import { DamageKind, Multiplier } from './damage';
import { Skill } from './skills';
import { AttackResultVo } from './value-objects/attackResultVo';

/** 純函式服務：跑完整傷害公式 */
export class CombatResolver {
  resolve(attacker: Combatant, target: Combatant, skill: Skill): AttackResultVo {
    const attackPower =
      skill.kind === DamageKind.Physical ? attacker.str : attacker.int;
    const raw = attackPower + skill.baseDamage;

    const multipliers: Multiplier[] = [
      { source: 'skill', value: skill.multiplier },
    ];
    const multiplied = multipliers.reduce(
      (acc, m) => acc * m.value,
      raw,
    );

    const mitigation =
      skill.kind === DamageKind.Physical ? target.def : target.mdef;

    const finalDamage = Math.max(1, Math.floor(multiplied - mitigation));

    return new AttackResultVo(finalDamage, skill.kind, skill.element, multipliers);
  }
}
