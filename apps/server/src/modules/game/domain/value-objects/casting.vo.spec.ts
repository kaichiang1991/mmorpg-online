import { SkillId } from '@mmo/shared';
import { SkillFactory } from '../skill-factory';
import { CastingVo } from './casting.vo';

const makeSkill = (skillId: SkillId = 'basic') => new SkillFactory().get(skillId)!;

describe('CastingVo', () => {
  it('throws when skill is instant cast', () => {
    expect(() => new CastingVo(makeSkill(), 0)).toThrow();
  });

  it('isDone when time is exactly at end time', () => {
    const skill = makeSkill('fireball');
    const casting = new CastingVo(skill, 0);
    expect(casting.isDone(skill.castTime)).toBe(true);
  });

  it('isDone returns false when time is before end time', () => {
    const casting = new CastingVo(makeSkill('fireball'), 0);
    expect(casting.isDone(0)).toBe(false);
  });

  it('isDone returns true when time is after end time', () => {
    const skill = makeSkill('fireball');
    const casting = new CastingVo(skill, 0);
    expect(casting.isDone(1 + skill.castTime)).toBe(true);
  });
});
