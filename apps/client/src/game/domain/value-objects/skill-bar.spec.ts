import { SKILL_MAPPING, SkillVo } from './skill-bar';

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
    expect(skill.name).toBe('attack');
    expect(skill.imageUrl).toBe('http://image');
  });
});

class SkillBar {
  static BAR_LENGTH = 10;
  static empty(): SkillBar {
    return new SkillBar([]);
  }

  private elements: SkillVo[] = [];

  constructor(skillIds: string[]) {
    if (skillIds.length > SkillBar.BAR_LENGTH)
      throw new Error(`SkillBar cannot have more than ${SkillBar.BAR_LENGTH} skills`);

    this.elements = Array.from({ length: SkillBar.BAR_LENGTH }, (_, i) => i).map((i) => {
      const skillId = skillIds.at(i);
      return SKILL_MAPPING.get(skillId ?? 'empty')!;
    });
  }

  get length(): number {
    return this.elements.length;
  }

  some(predict: (skill: SkillVo) => boolean): boolean {
    return this.elements.some(predict);
  }

  every(predict: (skill: SkillVo) => boolean): boolean {
    return this.elements.every(predict);
  }
}

describe('SkillBar', () => {
  it('empty skill bar has TEN empty skills', () => {
    const skillbar = SkillBar.empty();
    expect(skillbar.length).toBe(10);
    expect(skillbar.every((skill) => skill.id === '')).toBe(true);
  });
});
