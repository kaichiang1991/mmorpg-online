import { SkillVo } from './skill-bar';

const makeSkill = (overrides: Partial<InstanceType<typeof SkillVo>> = {}) =>
  new SkillVo(
    overrides.id ?? 'basic',
    overrides.name ?? 'attack',
    overrides.imageUrl ?? 'http://image',
  );

describe('Skill', () => {
  it('creates an empty skill', () => {
    const skill = SkillVo.empty();
    expect(skill.id).toBe('');
    expect(skill.name).toBe('');
    expect(skill.imageUrl).toBe('');
  });

  it('have all fields in normal skill', () => {
    const skill = makeSkill();
    expect(skill.id).toBe('basic');
    expect(skill.name).toBe('attack');
    expect(skill.imageUrl).toBe('http://image');
  });
});
