import { SkillBar, SkillVo } from './skill-bar';

const makeSkill = (overrides: Partial<InstanceType<typeof SkillVo>> = {}) =>
  new SkillVo(
    overrides.id ?? 'basic',
    overrides.name ?? 'Attack',
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
    expect(skill.name).toBe('Attack');
    expect(skill.imageUrl).toBe('http://image');
  });
});

describe('SkillBar', () => {
  it('empty skill bar has TEN empty skills', () => {
    const skillbar = SkillBar.empty();
    expect(skillbar.length).toBe(10);
    expect(skillbar.every((skill) => skill.id === '')).toBe(true);
  });
});
