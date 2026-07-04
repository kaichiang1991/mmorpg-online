import { Attack } from './attack';

const makeAttack = () => new Attack(10);
describe('Attack', () => {
  it('create with base damage', () => {
    const attack = makeAttack();
    expect(attack.baseDamage).toBe(10);
    expect(attack.multiplier).toBe(1);
    expect(attack.type).toBe('physic');
  });
});
