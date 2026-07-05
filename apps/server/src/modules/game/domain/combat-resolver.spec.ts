import { Combatant, DamageElement, DamageKind, Skill } from './attack';
import { CombatResolver } from './combat-resolver';

const makeCombatant = (overrides: Partial<Combatant> = {}): Combatant => ({
  str: 10,
  int: 10,
  def: 5,
  mdef: 5,
  critRate: 0,
  ...overrides,
});

const makeSkill = (overrides: Partial<Skill> = {}): Skill => ({
  id: 'fireball',
  baseDamage: 50,
  multiplier: 1.5,
  kind: DamageKind.Magical,
  element: DamageElement.Fire,
  ...overrides,
});

describe('CombatResolver', () => {
  const resolver = new CombatResolver();

  it('resolves physical damage using STR and DEF', () => {
    const attacker = makeCombatant({ str: 20 });
    const target = makeCombatant({ def: 8 });
    const skill = makeSkill({
      kind: DamageKind.Physical,
      element: DamageElement.None,
      baseDamage: 30,
      multiplier: 2,
    });

    const attack = resolver.resolve(attacker, target, skill);

    // raw = 20 + 30 = 50, multiplied = 50 * 2 = 100, final = 100 - 8 = 92
    expect(attack.finalDamage).toBe(92);
    expect(attack.kind).toBe(DamageKind.Physical);
    expect(attack.element).toBe(DamageElement.None);
    expect(attack.multipliers).toEqual([{ source: 'skill', value: 2 }]);
  });

  it('resolves magical damage using INT and MDEF', () => {
    const attacker = makeCombatant({ int: 40 });
    const target = makeCombatant({ mdef: 10 });
    const skill = makeSkill();

    const attack = resolver.resolve(attacker, target, skill);

    // raw = 40 + 50 = 90, multiplied = 90 * 1.5 = 135, final = 135 - 10 = 125
    expect(attack.finalDamage).toBe(125);
    expect(attack.kind).toBe(DamageKind.Magical);
    expect(attack.element).toBe(DamageElement.Fire);
  });

  it('clamps final damage to a minimum of 1', () => {
    const attacker = makeCombatant({ int: 1 });
    const target = makeCombatant({ mdef: 1000 });
    const skill = makeSkill({ baseDamage: 1, multiplier: 1 });

    const attack = resolver.resolve(attacker, target, skill);

    expect(attack.finalDamage).toBe(1);
  });
});
