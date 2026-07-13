import { SkillBarVo, SkillVo } from './skill-bar.vo';
import { SKILL_IDS, SkillId } from '@mmo/shared';

type SkillCtor = {
  id: SkillId;
  name: string;
  castingTimeMs: number;
  cooldownTimeMs: number;
};
const makeSkill = (overrides: Partial<SkillCtor> = {}) =>
  new SkillVo(
    overrides.id ?? 'basic',
    overrides.name ?? 'Attack',
    overrides.castingTimeMs ?? 0,
    overrides.cooldownTimeMs ?? 0,
  );

describe('Skill', () => {
  it('creates an empty skill', () => {
    const skill = SkillVo.empty();
    expect(skill.id).toBe('');
    expect(skill.name).toBe('');
    expect(skill.isInstantCast).toBe(true);
  });

  it('have all fields in normal skill', () => {
    const skill = makeSkill();
    expect(skill.id).toBe('basic');
    expect(skill.name).toBe('Attack');
    expect(skill.isInstantCast).toBe(true);
  });

  it('isReady when cooldown is 0', () => {
    const skill = makeSkill({ cooldownTimeMs: 0 });
    expect(skill.isReady).toBe(true);
  });

  it('cooldown process is 1 when skill just cast', () => {
    const skill = makeSkill({ cooldownTimeMs: 1000 });
    expect(skill.cooldownProcess).toBe(1);
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
    const newSkillBar = skillbar.insertSkillAt('basic', 0);

    expect(newSkillBar.some((skill) => skill.id === 'basic')).toBe(true);
    expect(newSkillBar.at(0).id).toBe('basic');
  });

  it('can insert at any position', () => {
    const skillbar = SkillBarVo.empty();
    const newSkillBar = skillbar.insertSkillAt('basic', 5);

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
