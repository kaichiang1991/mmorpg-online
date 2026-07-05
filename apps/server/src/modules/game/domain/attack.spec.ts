import { Attack, DamageElement, DamageKind } from './attack';

const makeAttack = () =>
  new Attack(320, DamageKind.Magical, DamageElement.Fire, [
    { source: 'skill', value: 1.5 },
    { source: 'crit', value: 2 },
  ]);

describe('Attack', () => {
  it('create with resolved damage snapshot', () => {
    const attack = makeAttack();
    expect(attack.finalDamage).toBe(320);
    expect(attack.kind).toBe(DamageKind.Magical);
    expect(attack.element).toBe(DamageElement.Fire);
    expect(attack.multipliers).toEqual([
      { source: 'skill', value: 1.5 },
      { source: 'crit', value: 2 },
    ]);
  });
});
