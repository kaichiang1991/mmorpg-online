import { Attack } from './attack';

const makeAttack = () => new Attack(10);
describe('Attack', () => {
  it('create with base damaRge', () => {
    const attack = makeAttack();
    expect(attack.baseDamage).toBe(10);
  });
});
