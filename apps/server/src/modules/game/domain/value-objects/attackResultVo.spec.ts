import { DamageElement, DamageKind } from '../damage';
import { AttackResultVo } from './attackResultVo';

const makeAttackResultVo = () =>
  new AttackResultVo(320, DamageKind.Magical, DamageElement.Fire, [
    { source: 'skill', value: 1.5 },
    { source: 'crit', value: 2 },
  ]);

describe('AttackResultVo', () => {
  it('create with resolved damage snapshot', () => {
    const result = makeAttackResultVo();
    expect(result.finalDamage).toBe(320);
    expect(result.kind).toBe(DamageKind.Magical);
    expect(result.element).toBe(DamageElement.Fire);
    expect(result.multipliers).toEqual([
      { source: 'skill', value: 1.5 },
      { source: 'crit', value: 2 },
    ]);
  });

  it('rejects non-positive damage', () => {
    expect(() => new AttackResultVo(0, DamageKind.Physical, DamageElement.None, [])).toThrow();
    expect(() => new AttackResultVo(-5, DamageKind.Physical, DamageElement.None, [])).toThrow();
  });

  it('rejects non-integer damage', () => {
    expect(() => new AttackResultVo(1.5, DamageKind.Physical, DamageElement.None, [])).toThrow();
  });

  it('isCrit reflects presence of crit multiplier', () => {
    expect(makeAttackResultVo().isCrit).toBe(true);
    const noCrit = new AttackResultVo(10, DamageKind.Physical, DamageElement.None, [
      { source: 'skill', value: 1.5 },
    ]);
    expect(noCrit.isCrit).toBe(false);
  });

  it('totalMultiplier multiplies all sources', () => {
    expect(makeAttackResultVo().totalMultiplier).toBe(3);
    const bare = new AttackResultVo(10, DamageKind.Physical, DamageElement.None, []);
    expect(bare.totalMultiplier).toBe(1);
  });
});
