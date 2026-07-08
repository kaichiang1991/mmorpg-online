import { SkillFactory } from './skill-factory';
import { BASIC_ATTACK, SPEAR } from './skills';

describe('SkillFactory', () => {
  const factory = new SkillFactory();

  it('resolves known skill ids', () => {
    expect(factory.get('basic')).toBe(BASIC_ATTACK);
    expect(factory.get('spear')).toBe(SPEAR);
  });

  it('yields undefined for unknown ids', () => {
    expect(factory.get('no-such-skill')).toBeUndefined();
    expect(factory.get('')).toBeUndefined();
  });
});
