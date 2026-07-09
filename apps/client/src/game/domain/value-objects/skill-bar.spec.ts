import { SKILL_MAPPING, SkillBarVo, SkillVo } from './skill-bar-vo';
import { SKILL_IDS } from '@mmo/shared';

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
    const skillbar = SkillBarVo.empty();
    expect(skillbar.length).toBe(10);
    expect(skillbar.every((skill) => skill.id === '')).toBe(true);
  });

  it('can insert at first position', () => {
    const skillbar = SkillBarVo.empty();
    const newSkillBar = skillbar.insertSkillAt(SKILL_MAPPING.get('basic')!, 0);

    expect(newSkillBar.some((skill) => skill.id === 'basic')).toBe(true);
    expect(newSkillBar.at(0).id).toBe('basic');
  });

  it('can insert at any position', () => {
    const skillbar = SkillBarVo.empty();
    const newSkillBar = skillbar.insertSkillAt(SKILL_MAPPING.get('basic')!, 5);

    expect(newSkillBar.some((skill) => skill.id === 'basic')).toBe(true);
    expect(newSkillBar.at(5).id).toBe('basic');
  });

  it('throws when constructed with more skills than BAR_LENGTH', () => {
    const tooManyIds = Array.from({ length: SkillBarVo.BAR_LENGTH + 1 }, () => SKILL_IDS[0]);
    expect(() => new SkillBarVo(tooManyIds)).toThrow(
      `SkillBar cannot have more than ${SkillBarVo.BAR_LENGTH} skills`,
    );
  });
});
